import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';

export const maxDuration = 300;

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ynww8bw3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const baseUrl = 'https://www.dezestien.nl';

interface SpecialConfig {
  type: string;
  shouldRun: (date: Date) => boolean;
  duplicateKeyword: string;
  getPrompts: (date: Date, recentArticles: any[]) => { system: string; user: string };
}

const SPECIALS: SpecialConfig[] = [
  {
    type: 'voetbal-geschiedenis',
    shouldRun: () => true,
    duplicateKeyword: 'Voetbal Geschiedenis',
    getPrompts: (date) => ({
      system: `Je bent een voetbal-historicus voor DeZestien.nl, een Nederlandse voetbalnieuwssite. Je schrijft korte, entertaining stukjes over wat er op deze datum in de voetbalgeschiedenis is gebeurd. Toon: vermakelijk maar informatief, alsof je een leuk weetje deelt met vrienden. Je volgt het opgegeven formaat EXACT.`,
      user: `Schrijf een kort "Vandaag in Voetbal Geschiedenis" artikel voor ${date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}.

REGELS:
- Noem 1-2 belangrijke voetbal-gebeurtenissen die op of rond deze datum hebben plaatsgevonden (game releases, studio-oprichtingen, historische momenten, belangrijke aankondigingen)
- 200-300 woorden
- Begin direct met het onderwerp, geen "Op deze dag..." cliché
- Voeg context toe: waarom was dit belangrijk voor de voetbal-industrie?
- Sluit af met een observatie die het verbindt aan het heden
- Toon: luchtig maar informatief, voor voetballiefhebbers (15-55 jaar)
- Schrijf ALLES in het Nederlands

FORMAAT (volg dit EXACT):
TITEL: Vandaag in Voetbal Geschiedenis: [onderwerp]
EXCERPT: [max 200 tekens, maakt nieuwsgierig]
IMAGE_PROMPT: [retro voetbal themed, nostalgic, historical voetbal moment, cinematic, no text]
---
[Artikel tekst met 1-2 ## koppen, max 300 woorden]`,
    }),
  },
  {
    type: 'midweek-check',
    shouldRun: (date) => date.getDay() === 3, // Woensdag
    duplicateKeyword: 'Midweek Check',
    getPrompts: (date, recentArticles) => {
      const titles = recentArticles.slice(0, 15).map((a: any) => `- ${a.title} (${a.category})`).join('\n');
      return {
        system: `Je bent de hoofdredacteur van DeZestien.nl, een Nederlandse voetbalnieuwssite (15-55 jaar). Elke woensdag schrijf je een "Midweek Check" waarin je de belangrijkste voetbal-verhalen van de week tot nu toe samenvat en je eigen analyse geeft. Toon: als een ervaren journalist die even terugblikt — nuchter maar met mening, zoals Tweakers of NOS op 3. Je volgt het opgegeven formaat EXACT.`,
        user: `Schrijf een "Midweek Check" samenvatting. Dit zijn de artikelen van deze week tot nu toe:

${titles}

REGELS:
- Kies de 3-5 meest impactvolle verhalen en bespreek ze
- Per verhaal: korte samenvatting (2-3 zinnen) plus je eigen analyse
- 600-800 woorden
- Schrijf ALLES in het Nederlands
- Toon: professioneel maar toegankelijk
- Eindig met een korte vooruitblik op de rest van de week
- Gebruik GEEN "Conclusie" als kopje

FORMAAT (volg dit EXACT):
TITEL: Midweek Check: [pakkende samenvatting van de week]
EXCERPT: [max 200 tekens]
IMAGE_PROMPT: [voetbal news collage, midweek editorial, modern digital newspaper design, no text]
---
[Artikel tekst met ## koppen per verhaal, 600-800 woorden]`,
      };
    },
  },
  {
    type: 'weekend-tips',
    shouldRun: (date) => date.getDay() === 5, // Vrijdag
    duplicateKeyword: 'Weekend Voetbal Tips',
    getPrompts: () => ({
      system: `Je bent een voetbal-redacteur voor DeZestien.nl, een Nederlandse voetbalnieuwssite (15-55 jaar). Elke vrijdag schrijf je een gezellig stuk met game-aanbevelingen voor het weekend. Toon: enthousiast maar niet opdringerig, alsof je tips geeft aan een vriend die ook gamet. Je volgt het opgegeven formaat EXACT.`,
      user: `Schrijf "Weekend Voetbal Tips" voor dit weekend.

REGELS:
- Geef 3-5 concrete game-aanbevelingen
- Mix van genres: casual, multiplayer, singleplayer, indie
- Per tip: 2-3 zinnen over waarom deze game nu leuk is om te spelen
- Noem platforms waar de game op speelbaar is
- 500-700 woorden
- Schrijf ALLES in het Nederlands
- Sluit af met een vraag aan de lezer ("Wat ga jij spelen dit weekend?")

FORMAAT (volg dit EXACT):
TITEL: Weekend Voetbal Tips: [pakkend thema]
EXCERPT: [max 200 tekens]
IMAGE_PROMPT: [cozy voetbal setup, weekend vibes, controller, warm lighting, cinematic, no text]
---
[Artikel tekst met ## per game-tip, 500-700 woorden]`,
    }),
  },
  {
    type: 'week-in-voetbal',
    shouldRun: (date) => date.getDay() === 6, // Zaterdag
    duplicateKeyword: 'Week in Voetbal',
    getPrompts: (date, recentArticles) => {
      const summaries = recentArticles.slice(0, 25).map((a: any) =>
        `- ${a.title} (${a.category}): ${a.excerpt || ''}`
      ).join('\n');
      return {
        system: `Je bent de hoofdredacteur van DeZestien.nl, een Nederlandse voetbalnieuwssite (15-55 jaar). Elke zaterdag schrijf je het grote weekoverzicht: "Week in Voetbal". Dit is het vlaggenschip redactionele stuk. Je vat alle belangrijke voetbalnieuwtjes samen, geeft context, en sluit af met je eigen kijk op de week. Toon: professioneel, overzichtelijk, met genuanceerde mening — zoals een Tweakers-redactioneel. Je volgt het opgegeven formaat EXACT.`,
        user: `Schrijf het "Week in Voetbal" weekoverzicht. Dit zijn de artikelen van deze week:

${summaries}

REGELS:
- Groepeer nieuws in 3-4 thema's (bijv. "Grote releases", "Industry news", "Community & Indie")
- Per thema: korte samenvatting met eigen analyse
- 800-1000 woorden
- Schrijf ALLES in het Nederlands
- Begin met de headline van de week (het grootste verhaal)
- Eindig met "Redactie's keuze van de week" — 1 artikel dat eruit sprong en waarom
- Gebruik GEEN "Conclusie" als kopje

FORMAAT (volg dit EXACT):
TITEL: Week in Voetbal: [headline van de week]
EXCERPT: [max 200 tekens]
IMAGE_PROMPT: [epic voetbal montage, weekly roundup, editorial newspaper style, voetbal themed, cinematic, no text]
---
[Artikel tekst met ## koppen per thema, 800-1000 woorden]`,
      };
    },
  },
  {
    type: 'maandoverzicht',
    shouldRun: (date) => date.getDate() === 1, // 1e van de maand
    duplicateKeyword: 'Maandoverzicht',
    getPrompts: (date, recentArticles) => {
      const prevMonth = new Date(date);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const monthName = prevMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
      const titles = recentArticles.slice(0, 30).map((a: any) => `- ${a.title} (${a.category})`).join('\n');
      return {
        system: `Je bent de hoofdredacteur van DeZestien.nl, een Nederlandse voetbalnieuwssite (15-55 jaar). Aan het begin van elke maand schrijf je het grote maandoverzicht. Dit is een diepgaand terugblik-artikel dat de belangrijkste trends, releases en momenten samenvat. Toon: professioneel, met observaties en trends — als een jaaroverzicht maar dan voor een maand. Je volgt het opgegeven formaat EXACT.`,
        user: `Schrijf het "DeZestien Maandoverzicht" voor ${monthName}.

Recente artikelen als context:
${titles}

REGELS:
- Samenvatting van de vorige maand in voetbal
- Secties: "Grootste Releases", "Industrie Nieuws", "Community Highlights", "Redactie Keuzes"
- 800-1200 woorden
- Schrijf ALLES in het Nederlands
- Eindig met een vooruitblik op de komende maand
- Gebruik GEEN "Conclusie" als kopje

FORMAAT (volg dit EXACT):
TITEL: Maandoverzicht ${monthName}: [headline]
EXCERPT: [max 200 tekens]
IMAGE_PROMPT: [monthly voetbal calendar, retrospective, editorial design, voetbal montage, cinematic, no text]
---
[Artikel tekst met ## koppen per sectie, 800-1200 woorden]`,
      };
    },
  },
];

export async function GET(req: Request) {
  // Auth check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nlTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));

  // Welke specials moeten vandaag draaien?
  const toRun = SPECIALS.filter((s) => s.shouldRun(nlTime));

  if (toRun.length === 0) {
    return NextResponse.json({ specials: [], reason: 'Geen specials voor vandaag' });
  }

  // Haal recente artikelen op als context (laatste 7 dagen)
  const weekAgo = new Date(nlTime);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentArticles = await sanityClient.fetch(
    `*[_type == "post" && publishedAt >= $start] | order(publishedAt desc) { title, category, excerpt, publishedAt }`,
    { start: weekAgo.toISOString() }
  );

  // Check welke specials vandaag al gepubliceerd zijn (voorkom duplicaten)
  const todayStart = new Date(nlTime);
  todayStart.setHours(0, 0, 0, 0);
  const todayTitles = await sanityClient.fetch<string[]>(
    `*[_type == "post" && publishedAt >= $start && category in ["Special", "Feature"]].title`,
    { start: todayStart.toISOString() }
  );

  const results = [];

  for (const special of toRun) {
    // Skip als deze rubriek vandaag al is gepubliceerd
    const alreadyPublished = todayTitles.some((t) =>
      t.toLowerCase().includes(special.duplicateKeyword.toLowerCase())
    );

    if (alreadyPublished) {
      results.push({ type: special.type, status: 'skipped', reason: 'Vandaag al gepubliceerd' });
      continue;
    }

    try {
      const prompts = special.getPrompts(nlTime, recentArticles);

      const genResponse = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({
          sourceTitle: special.duplicateKeyword,
          sourceContent: '',
          sourceUrl: '',
          sourceName: 'DeZestien Redactie',
          category: 'Special',
          isSpecial: true,
          specialType: special.type,
          customSystemPrompt: prompts.system,
          customUserPrompt: prompts.user,
        }),
      });

      if (genResponse.ok) {
        const data = await genResponse.json();
        results.push({ type: special.type, status: 'ok', slug: data.slug, title: data.title });
      } else {
        const errText = await genResponse.text();
        results.push({ type: special.type, status: 'error', error: errText });
      }
    } catch (err: any) {
      results.push({ type: special.type, status: 'error', error: err.message });
    }

    // 15s delay tussen specials
    if (toRun.indexOf(special) < toRun.length - 1) {
      await new Promise((r) => setTimeout(r, 15000));
    }
  }

  // Podcast scan (dagelijks meedraaien)
  let podcastResults = null;
  try {
    const podcastResponse = await fetch(`${baseUrl}/api/cron/podcast-scan`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    if (podcastResponse.ok) {
      podcastResults = await podcastResponse.json();
    }
  } catch (podcastErr: any) {
    podcastResults = { error: podcastErr.message };
  }

  return NextResponse.json({ specials: results, podcasts: podcastResults });
}
