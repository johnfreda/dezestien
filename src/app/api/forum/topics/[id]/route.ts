import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET: Haal een specifiek topic op (iedereen kan lezen)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const topic = await prisma.forumTopic.findUnique({
      where: { id },
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
      }
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic niet gevonden' }, { status: 404 });
    }

    // Verhoog view count
    await prisma.forumTopic.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    return NextResponse.json({
      topic: {
        ...topic,
        replyCount: topic._count.replies,
      }
    });
  } catch (error: any) {
    console.error('Error fetching topic:', error);
    return NextResponse.json({ error: 'Fout bij ophalen topic' }, { status: 500 });
  }
}

// PUT: Update een topic (alleen eigenaar)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { id } = await params;
    const { title, content, category } = await req.json();

    // Check of topic bestaat en gebruiker is eigenaar
    const topic = await prisma.forumTopic.findUnique({
      where: { id },
      include: { user: { select: { id: true } } }
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic niet gevonden' }, { status: 404 });
    }

    if (topic.userId !== session.user.id) {
      return NextResponse.json({ error: 'Je kunt alleen je eigen topics bewerken' }, { status: 403 });
    }

    // Update data
    const updateData: any = {};
    if (title !== undefined) {
      if (title.length < 3 || title.length > 200) {
        return NextResponse.json({ error: 'Titel moet tussen 3 en 200 tekens zijn' }, { status: 400 });
      }
      updateData.title = title;
    }
    if (content !== undefined) {
      if (content.length < 10) {
        return NextResponse.json({ error: 'Inhoud moet minimaal 10 tekens zijn' }, { status: 400 });
      }
      updateData.content = content;
    }
    if (category !== undefined) {
      updateData.category = category;
    }

    // Update topic
    const updatedTopic = await prisma.forumTopic.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json({ topic: updatedTopic });
  } catch (error: any) {
    console.error('Error updating topic:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken topic' }, { status: 500 });
  }
}

// DELETE: Verwijder een topic (alleen eigenaar)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { id } = await params;

    // Check of topic bestaat en gebruiker is eigenaar
    const topic = await prisma.forumTopic.findUnique({
      where: { id },
      include: { user: { select: { id: true } } }
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic niet gevonden' }, { status: 404 });
    }

    if (topic.userId !== session.user.id) {
      return NextResponse.json({ error: 'Je kunt alleen je eigen topics verwijderen' }, { status: 403 });
    }

    // Verwijder topic (cascade verwijdert ook alle replies)
    await prisma.forumTopic.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen topic' }, { status: 500 });
  }
}
