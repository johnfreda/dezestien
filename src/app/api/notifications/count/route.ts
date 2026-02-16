import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET: Haal aantal ongelezen notificaties op
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    return NextResponse.json({ count }, {
      headers: { 'Cache-Control': 'private, max-age=15' },
    });
  } catch (error: any) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json({ count: 0 });
  }
}
