import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const maxDuration = 120;

// POST: Handmatig artikel genereren (admin only)
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

    const { topic, category, youtubeUrl } = await req.json();

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Onderwerp is verplicht' }, { status: 400 });
    }

    // Roep de bestaande generate route aan met CRON_SECRET
    const genResponse = await fetch(`https://www.dezestien.nl/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({
        sourceTitle: topic.trim(),
        sourceContent: topic.trim(),
        sourceUrl: '',
        sourceName: 'DeZestien Redactie',
        category: category || 'Nieuws',
        youtubeUrl: youtubeUrl || undefined,
      }),
    });

    const contentType = genResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await genResponse.text();
      console.error('Generate API returned non-JSON:', text.slice(0, 200));
      return NextResponse.json(
        { error: 'Generate API gaf een onverwacht antwoord terug' },
        { status: 502 }
      );
    }

    const data = await genResponse.json();

    if (!genResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Genereren mislukt' },
        { status: genResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis' },
      { status: 500 }
    );
  }
}
