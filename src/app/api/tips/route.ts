import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { auth } from '@/auth';

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynww8bw3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { title, url, description, category } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Titel en beschrijving zijn verplicht' }, { status: 400 });
    }

    const tip = await writeClient.create({
      _type: 'tip',
      title,
      url: url || undefined,
      description,
      category: category || 'Nieuws',
      submittedBy: session?.user?.email || 'Anoniem',
      submittedAt: new Date().toISOString(),
      status: 'pending',
    });

    return NextResponse.json({ success: true, tipId: tip._id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Tip indienen mislukt' }, { status: 500 });
  }
}
