import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Slug verplicht' }, { status: 400 });

  const session = await auth();

  const ratings = await prisma.userRating.aggregate({
    where: { articleSlug: slug },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Platform counts aggregation
  const platformGroups = await prisma.userRating.groupBy({
    by: ['platform'],
    where: { articleSlug: slug, platform: { not: null } },
    _count: { platform: true },
  });

  const platformCounts: Record<string, number> = {};
  for (const g of platformGroups) {
    if (g.platform) {
      platformCounts[g.platform] = g._count.platform;
    }
  }

  let userRating = null;
  let userPlatform = null;
  if (session?.user?.id) {
    const existing = await prisma.userRating.findUnique({
      where: { userId_articleSlug: { userId: session.user.id, articleSlug: slug } },
    });
    userRating = existing?.rating ?? null;
    userPlatform = existing?.platform ?? null;
  }

  return NextResponse.json({
    average: Math.round(ratings._avg.rating || 0),
    count: ratings._count.rating,
    userRating,
    userPlatform,
    platformCounts,
  }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const { slug, rating, platform } = await req.json();
  if (!slug || rating == null) return NextResponse.json({ error: 'Slug en rating verplicht' }, { status: 400 });

  const clampedRating = Math.min(100, Math.max(10, Math.round(Number(rating))));

  // Check if this is a new rating (not an update)
  const existing = await prisma.userRating.findUnique({
    where: { userId_articleSlug: { userId: session.user.id, articleSlug: slug } },
  });

  const result = await prisma.userRating.upsert({
    where: { userId_articleSlug: { userId: session.user.id, articleSlug: slug } },
    update: { rating: clampedRating, platform: platform || null },
    create: { userId: session.user.id, articleSlug: slug, rating: clampedRating, platform: platform || null },
  });

  // Award mana for first rating on this article
  if (!existing) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { mana: { increment: 10 } },
      }),
      prisma.manaLog.create({
        data: {
          userId: session.user.id,
          amount: 10,
          reason: 'Community beoordeling gegeven',
        },
      }),
    ]);
  }

  return NextResponse.json({ success: true, rating: result.rating, platform: result.platform });
}
