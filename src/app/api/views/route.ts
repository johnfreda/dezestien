import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ error: 'Slug verplicht' }, { status: 400 });

    const view = await prisma.articleView.upsert({
      where: { slug },
      update: { count: { increment: 1 } },
      create: { slug, count: 1 },
    });

    return NextResponse.json({ count: view.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
