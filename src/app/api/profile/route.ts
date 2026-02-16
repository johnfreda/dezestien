import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { avatars } from '@/lib/avatars';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      mana: true,
      role: true,
      createdAt: true,
      _count: { select: { comments: true, forumTopics: true, forumReplies: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

  return NextResponse.json(user, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const { name, image } = await req.json();

  // Validate avatar mana requirement
  if (image !== undefined) {
    const avatar = avatars.find((a) => a.id === image);
    if (!avatar) return NextResponse.json({ error: 'Ongeldige avatar' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mana: true },
    });
    if (user && avatar.manaRequired > user.mana) {
      return NextResponse.json({ error: 'Niet genoeg mana voor deze avatar' }, { status: 403 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: String(name).slice(0, 30) }),
      ...(image !== undefined && { image }),
    },
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(updated);
}
