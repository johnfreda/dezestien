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
  try {
    const { documentId, prompt } = await req.json();

    if (!documentId || !prompt) {
      return NextResponse.json(
        { error: 'documentId en prompt zijn vereist' },
        { status: 400 }
      );
    }

    // Verificatie: check of het document bestaat in Sanity
    const doc = await sanityClient.fetch(
      `*[_id == $id || _id == "drafts." + $id][0]{ _id }`,
      { id: documentId }
    );

    if (!doc) {
      return NextResponse.json(
        { error: 'Document niet gevonden' },
        { status: 404 }
      );
    }

    // Generate image met Pollinations.ai (gratis, geen API key nodig)
    const imagePrompt = `Gaming news article hero image: ${prompt}. Style: vibrant, cinematic, modern digital art, no text or watermarks`;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1792&height=1024&nologo=true&seed=${Date.now()}`;

    // Download de afbeelding van Pollinations
    const imgFetch = await fetch(pollinationsUrl);
    if (!imgFetch.ok) {
      return NextResponse.json(
        { error: 'Afbeelding genereren via Pollinations mislukt' },
        { status: 500 }
      );
    }
    const imgBuffer = Buffer.from(await imgFetch.arrayBuffer());

    // Upload naar Sanity
    const asset = await sanityClient.assets.upload('image', imgBuffer, {
      filename: `studio-generated-${Date.now()}.png`,
      contentType: 'image/png',
    });

    // Patch het document met de afbeelding
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
    console.error('Studio image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Afbeelding genereren mislukt' },
      { status: 500 }
    );
  }
}
