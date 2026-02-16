import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

export const maxDuration = 120;

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynww8bw3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export async function POST(req: Request) {
  // Auth check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentId, prompt } = await req.json();

    if (!documentId || !prompt) {
      return NextResponse.json(
        { error: 'documentId and prompt are required' },
        { status: 400 }
      );
    }

    // Generate image with Pollinations.ai
    const imagePrompt = `Gaming news article hero image: ${prompt}. Style: vibrant, cinematic, modern digital art, no text or watermarks`;
    const pollinationsUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(imagePrompt)}?model=flux&width=1792&height=1024&nologo=true&seed=${Date.now() % 2147483647}`;

    // Download the image van Pollinations
    const imgFetch = await fetch(pollinationsUrl, {
      headers: {
        Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
      },
    });
    if (!imgFetch.ok) {
      const errText = await imgFetch.text().catch(() => 'no body');
      return NextResponse.json(
        { error: `Pollinations image error: ${imgFetch.status}`, detail: errText },
        { status: 500 }
      );
    }
    const imgBuffer = Buffer.from(await imgFetch.arrayBuffer());

    // Upload to Sanity
    const asset = await sanityClient.assets.upload('image', imgBuffer, {
      filename: `generated-${Date.now()}.png`,
      contentType: 'image/png',
    });

    // Patch the document with the image
    await sanityClient
      .patch(documentId)
      .set({
        mainImage: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
          alt: prompt,
        },
      })
      .commit();

    return NextResponse.json({
      success: true,
      assetId: asset._id,
      documentId,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Afbeelding genereren mislukt' },
      { status: 500 }
    );
  }
}
