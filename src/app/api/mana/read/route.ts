import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const { articleSlug } = await req.json();
  if (!articleSlug) return NextResponse.json({ error: 'Slug verplicht' }, { status: 400 });

  // Check of gebruiker al mana heeft gekregen voor dit artikel
  const existing = await prisma.manaLog.findFirst({
    where: {
      userId: session.user.id,
      reason: { contains: articleSlug },
    },
  });

  if (existing) {
    return NextResponse.json({ alreadyEarned: true, mana: 0 });
  }

  const amount = 5;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { mana: { increment: amount } },
    }),
    prisma.manaLog.create({
      data: {
        userId: session.user.id,
        amount,
        reason: `Artikel gelezen: ${articleSlug}`,
      },
    }),
  ]);

  return NextResponse.json({ alreadyEarned: false, mana: amount });
}
