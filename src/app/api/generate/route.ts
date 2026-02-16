import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { textToBlocks } from '@/lib/portable-text-utils';

export const maxDuration = 120;

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynww8bw3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96);
}

export async function POST(req: Request) {
  // Auth check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      sourceTitle, sourceContent, sourceUrl, sourceName, category,
      isSpecial, specialType, customSystemPrompt, customUserPrompt,
      youtubeUrl,
    } = await req.json();

    if (!sourceTitle && !isSpecial) {
      return NextResponse.json({ error: 'sourceTitle is required' }, { status: 400 });
    }

    // Dynamisch woordaantal per categorie
    function getWordRange(cat: string, content: string): string {
      if (cat === 'Gerucht' || (content && content.length < 500 && !isSpecial)) return '200-300 woorden';
      if (cat === 'Review') return '800-1200 woorden';
      if (cat === 'Special' || cat === 'Feature' || cat === 'Opinie') return '600-800 woorden';
      return '300-500 woorden';
    }

    const wordRange = getWordRange(category, sourceContent || '');

    // Prompt selectie: custom prompts voor specials, standaard voor nieuws
    let systemPrompt: string;
    let userPrompt: string;

    if (isSpecial && customSystemPrompt && customUserPrompt) {
      systemPrompt = customSystemPrompt;
      userPrompt = customUserPrompt;
    } else {
      systemPrompt = `Je bent een voetbal-journalist voor DeZestien.nl, een Nederlandse voetbalnieuwssite voor volwassen voetbalfans (25-50 jaar). Je schrijft vlot en toegankelijk, met kennis van zaken. Niet overdreven enthousiast, niet droog — gewoon lekker leesbaar, zoals je het aan een collega zou vertellen die ook gamet. Denk qua toon aan Tweakers of NOS op 3. Je volgt het opgegeven formaat EXACT.`;

      userPrompt = `Schrijf een nieuwsartikel in het Nederlands op basis van deze bron.

BRON TITEL: ${sourceTitle}
BRON: ${sourceName}
BRON INHOUD: ${sourceContent || '(niet beschikbaar)'}
CATEGORIE: ${category}

STIJLREGELS:
- Schrijf ALLES in het Nederlands
- Toon: vlot, nuchter, toegankelijk. Schrijf voor volwassen voetbalfans, niet voor tieners
- Wees niet overdreven enthousiast (geen "SICK!" of "mijn game-gekke vriend"). Gewoon normaal Nederlands
- Af en toe een vleugje humor of een eigen observatie mag, maar forceer het niet
- Vermijd corporate-taal ("wij zullen u informeren"), maar ook overdreven straattaal
- Begin direct met het nieuws, geen inleidingen
- Gebruik GEEN "Conclusie" als kopje. Sluit af met een korte vooruitblik of eigen inschatting
- Durf een genuanceerde mening te geven waar het past
- Voetbal-termen mogen als ze algemeen bekend zijn, maar niet geforceerd

REGIOREGELS:
- Je publiek is NEDERLANDS. Schrijf vanuit een Nederlands/Europees perspectief
- Als het bronnieuws over een sale, deal of aanbieding gaat: vermeld of dit ook in Nederland/Europa beschikbaar is. Zo niet, maak dit duidelijk
- Vermijd verwijzingen naar US-specifieke winkels (Best Buy, Walmart, Target, GameStop fysiek) — noem liever Nederlandse/Europese alternatieven (bol.com, Coolblue, MediaMarkt, Steam, PlayStation Store, eShop)
- Prijzen bij voorkeur in euro's
- Release-datums: vermeld de Europese datum als die afwijkt

STRUCTUURREGELS:
- Maak een pakkende, korte Nederlandse titel (niet letterlijk vertalen, maar herformuleren)
- Schrijf een excerpt van max 200 tekens die nieuwsgierig maakt
- Gebruik korte alinea's (2-3 zinnen max)
- Gebruik 2-3 inhoudelijke h2 koppen (## ) — geen generieke koppen als "Wat betekent dit?"
- Schrijf ${wordRange} (niet langer!)
- Vermeld de bron (${sourceName}) ergens in het artikel
- Genereer een korte Engelse prompt voor een hero afbeelding (voetbal themed, cinematic, geen tekst)

Je antwoord MOET beginnen met exact dit formaat (de eerste ${category === 'Review' ? '4' : '3'} regels):
TITEL: [Nederlandse titel hier]
EXCERPT: [Korte samenvatting hier, max 200 tekens]
IMAGE_PROMPT: [Engelse prompt voor hero afbeelding]${category === 'Review' ? '\nSCORE: [Cijfer van 1 tot 100 — gebaseerd op de bronreview. Gebruik de volledige schaal: 1-30 slecht, 30-50 matig, 50-70 redelijk, 70-85 goed, 85-95 uitstekend, 95-100 meesterwerk]' : ''}
---
[Artikel tekst in markdown met ## koppen]`;
    }

    const pollinationsResponse = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'mistral',
      }),
    });

    if (!pollinationsResponse.ok) {
      throw new Error(`Pollinations API error: ${pollinationsResponse.status}`);
    }

    const responseJson = await pollinationsResponse.json();
    const responseText = responseJson.choices?.[0]?.message?.content || '';

    // Parse response — robuust: meerdere patterns proberen
    const titleMatch = responseText.match(/TITEL:\s*(.+)/);
    const excerptMatch = responseText.match(/EXCERPT:\s*(.+)/);
    const imagePromptMatch = responseText.match(/IMAGE_PROMPT:\s*(.+)/);
    const scoreMatch = responseText.match(/SCORE:\s*(\d+)/);
    const bodyMatch = responseText.split(/^---$/m);

    // Fallback titel: eerste ## heading als TITEL: niet gevonden
    const h2Match = !titleMatch ? responseText.match(/^##\s+(.+)/m) : null;
    const title = (titleMatch?.[1]?.trim() || h2Match?.[1]?.trim() || sourceTitle).replace(/\*+/g, '').replace(/^["']|["']$/g, '');
    const excerpt = (excerptMatch?.[1]?.trim() || '').replace(/\*+/g, '').replace(/^["']|["']$/g, '').slice(0, 300);
    const imagePrompt = (imagePromptMatch?.[1]?.trim() || `voetbal news ${category} illustration digital art`).replace(/^["']|["']$/g, '');
    // Extract body and strip any remaining metadata markers
    let bodyText = bodyMatch.length > 1 ? bodyMatch.slice(1).join('---').trim() : responseText;
    bodyText = bodyText
      .replace(/^TITEL:\s*.+$/gm, '')
      .replace(/^EXCERPT:\s*.+$/gm, '')
      .replace(/^IMAGE_PROMPT:\s*.+$/gm, '')
      .replace(/^SCORE:\s*\d+$/gm, '')
      .replace(/^---$/gm, '')
      .trim();

    const slug = slugify(title);

    // Convert body to Portable Text blocks
    const bodyBlocks = textToBlocks(bodyText);

    // Create Sanity document
    const doc: any = {
      _type: 'post',
      title,
      slug: { _type: 'slug', current: slug },
      author: 'DeZestien Redactie',
      category,
      excerpt,
      imagePrompt,
      originalUrl: isSpecial ? undefined : (sourceUrl || undefined),
      publishedAt: new Date().toISOString(),
      isHot: false,
      body: bodyBlocks,
      ...(category === 'Review' && scoreMatch ? { score: Math.min(100, Math.max(1, parseInt(scoreMatch[1], 10))) } : {}),
    };

    // Specials krijgen een type-markering
    if (isSpecial && specialType) {
      doc.specialType = specialType;
    }

    // YouTube embed toevoegen als meegegeven
    if (youtubeUrl) {
      doc.youtubeEmbed = youtubeUrl;
    }

    const result = await sanityClient.create(doc);

    // Try to generate an image (non-blocking — article is already saved)
    try {
      const baseUrl = 'https://www.dezestien.nl';

      await fetch(`${baseUrl}/api/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({
          documentId: result._id,
          prompt: imagePrompt,
        }),
      });
    } catch (imgErr) {
      console.error('Image generation failed (article still published):', imgErr);
    }

    // Ping zoekmachines dat er een nieuwe pagina is (SEO indexatie versnellen)
    const articleUrl = `https://www.dezestien.nl/artikel/${slug}`;
    try {
      // Google sitemap ping
      await fetch(`https://www.google.com/ping?sitemap=https://www.dezestien.nl/sitemap.xml`);
      // IndexNow ping (Bing, Yandex en deels Google)
      await fetch(`https://api.indexnow.org/indexnow?url=${encodeURIComponent(articleUrl)}&key=${process.env.INDEXNOW_KEY || 'dezestien'}`);
    } catch (pingErr) {
      // Niet kritiek — artikel is al gepubliceerd
      console.error('Search engine ping failed:', pingErr);
    }

    return NextResponse.json({
      success: true,
      slug,
      id: result._id,
      title,
    });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Genereren mislukt' },
      { status: 500 }
    );
  }
}
