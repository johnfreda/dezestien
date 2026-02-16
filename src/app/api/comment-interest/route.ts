import { NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

const SANITY_TOKEN = process.env.SANITY_API_TOKEN;

export async function POST(req: Request) {
  try {
    const { email, slug } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mailadres is verplicht.' }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres.' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await client.fetch(
      `*[_type == "commentInterest" && email == $email][0]`,
      { email: email.toLowerCase().trim() }
    );

    if (existing) {
      // Already signed up, just return success (don't reveal this)
      return NextResponse.json({ success: true });
    }

    // Store in Sanity
    const writeClient = client.withConfig({ token: SANITY_TOKEN });
    await writeClient.create({
      _type: 'commentInterest',
      email: email.toLowerCase().trim(),
      articleSlug: slug || null,
      signedUpAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Comment interest error:', error);
    return NextResponse.json({ error: 'Er ging iets mis.' }, { status: 500 });
  }
}
