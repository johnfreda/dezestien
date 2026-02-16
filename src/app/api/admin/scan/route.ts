import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const maxDuration = 300;

// POST: Handmatig RSS scanner triggeren (admin only)
export async function POST(req: Request) {
  try {
    // Admin check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen admin rechten' }, { status: 403 });
    }

    // Force override parameters uit request body
    let force = false;
    let count = 5;
    try {
      const body = await req.json();
      force = body.force === true;
      count = Math.min(Math.max(parseInt(body.count, 10) || 5, 1), 20);
    } catch {}

    // Roep de bestaande scan route aan met CRON_SECRET
    const params = force ? `?force=true&count=${count}` : '';
    const scanResponse = await fetch(`https://www.dezestien.nl/api/cron/scan${params}`, {
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const contentType = scanResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await scanResponse.text();
      console.error('Scan API returned non-JSON:', text.slice(0, 200));
      return NextResponse.json(
        { error: 'Scan API gaf een onverwacht antwoord terug' },
        { status: 502 }
      );
    }

    const data = await scanResponse.json();

    if (!scanResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Scanner mislukt' },
        { status: scanResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
