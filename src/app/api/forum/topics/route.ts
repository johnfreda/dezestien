import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET: Haal alle topics op (iedereen kan lezen)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'recent'; // recent, popular, oldest

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    let orderBy: any = {};
    if (sort === 'popular') {
      orderBy = { replyCount: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else {
      // recent: pinned first, then by lastReplyAt or createdAt
      orderBy = [
        { isPinned: 'desc' },
        { lastReplyAt: 'desc' },
        { createdAt: 'desc' }
      ];
    }

    const topics = await prisma.forumTopic.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        _count: {
          select: { replies: true }
        }
      },
      orderBy,
      take: 50,
    });

    // Update replyCount from _count
    const topicsWithCount = topics.map(topic => ({
      ...topic,
      replyCount: topic._count.replies,
    }));

    return NextResponse.json({ topics: topicsWithCount }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (error: any) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Fout bij ophalen topics' }, { status: 500 });
  }
}

// POST: Maak een nieuw topic (alleen ingelogd)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Je moet ingelogd zijn om een topic te maken' }, { status: 401 });
    }

    const { title, content, category } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Titel en inhoud zijn verplicht' }, { status: 400 });
    }

    if (title.length < 3 || title.length > 200) {
      return NextResponse.json({ error: 'Titel moet tussen 3 en 200 tekens zijn' }, { status: 400 });
    }

    if (content.length < 10 || content.length > 10000) {
      return NextResponse.json({ error: 'Inhoud moet tussen 10 en 10.000 tekens zijn' }, { status: 400 });
    }

    // Transactie: Topic maken + Mana geven + Loggen
    const [topic] = await prisma.$transaction([
      prisma.forumTopic.create({
        data: {
          title,
          content,
          category: category || 'Algemeen',
          userId: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { mana: { increment: 100 } }
      }),
      prisma.manaLog.create({
        data: {
          userId: session.user.id,
          amount: 100,
          reason: 'Forum topic aangemaakt'
        }
      })
    ]);

    return NextResponse.json({ topic, manaEarned: 100 });
  } catch (error: any) {
    console.error('Error creating topic:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken topic' }, { status: 500 });
  }
}
