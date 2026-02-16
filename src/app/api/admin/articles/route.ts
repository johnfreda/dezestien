import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@sanity/client';
import { textToBlocks } from '@/lib/portable-text-utils';
import { revalidatePath } from 'next/cache';

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vi366jej',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export async function PATCH(req: Request) {
  try {
    // Auth check
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

    const body = await req.json();
    const { _id, title, excerpt, category, score, bodyMarkdown, mainImage, boxImage, pros, cons, isHot, platforms, reviewType } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Document _id is vereist' }, { status: 400 });
    }

    // Build patch object with only provided fields
    const patch: Record<string, any> = {};

    if (title !== undefined) patch.title = title;
    if (excerpt !== undefined) patch.excerpt = excerpt;
    if (category !== undefined) patch.category = category;
    if (score !== undefined) patch.score = Math.min(100, Math.max(1, Number(score)));
    if (isHot !== undefined) patch.isHot = Boolean(isHot);
    if (pros !== undefined) patch.pros = pros;
    if (cons !== undefined) patch.cons = cons;

    // Convert markdown body to Portable Text blocks
    if (bodyMarkdown !== undefined) {
      patch.body = textToBlocks(bodyMarkdown);
    }

    if (platforms !== undefined) patch.platforms = platforms;
    if (reviewType !== undefined) patch.reviewType = reviewType;

    // Handle mainImage asset reference
    if (mainImage !== undefined) {
      patch.mainImage = mainImage;
    }

    // Handle boxImage asset reference
    if (boxImage !== undefined) {
      patch.boxImage = boxImage;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Geen velden om bij te werken' }, { status: 400 });
    }

    const result = await sanityClient.patch(_id).set(patch).commit();

    // Bust ISR cache for this article and homepage
    revalidatePath('/artikel/[slug]', 'page');
    revalidatePath('/', 'page');

    return NextResponse.json({ success: true, id: result._id });
  } catch (error: any) {
    console.error('Admin article update error:', error);
    return NextResponse.json(
      { error: error.message || 'Bijwerken mislukt' },
      { status: 500 }
    );
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96);
}

// POST: Nieuw artikel aanmaken
export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    const { title, excerpt, category, score, bodyMarkdown, mainImage, boxImage, pros, cons, isHot, platforms, reviewType } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Titel is vereist' }, { status: 400 });
    }

    const slug = slugify(title);

    const doc: any = {
      _type: 'post',
      title: title.trim(),
      slug: { _type: 'slug', current: slug },
      author: 'DeZestien Redactie',
      category: category || 'Nieuws',
      excerpt: excerpt || '',
      publishedAt: new Date().toISOString(),
      isHot: Boolean(isHot),
      body: bodyMarkdown ? textToBlocks(bodyMarkdown) : [],
    };

    if (category === 'Review' && score) {
      doc.score = Math.min(100, Math.max(1, Number(score)));
      if (pros?.length) doc.pros = pros.filter((p: string) => p.trim());
      if (cons?.length) doc.cons = cons.filter((c: string) => c.trim());
      if (platforms?.length) doc.platforms = platforms;
      doc.reviewType = reviewType || 'game';
    }

    if (mainImage) {
      doc.mainImage = mainImage;
    }

    if (boxImage) {
      doc.boxImage = boxImage;
    }

    const result = await sanityClient.create(doc);

    revalidatePath('/', 'page');

    return NextResponse.json({ success: true, slug, id: result._id });
  } catch (error: any) {
    console.error('Admin article create error:', error);
    return NextResponse.json(
      { error: error.message || 'Aanmaken mislukt' },
      { status: 500 }
    );
  }
}
