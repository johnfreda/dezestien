import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const logs = await prisma.manaLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(logs, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}
