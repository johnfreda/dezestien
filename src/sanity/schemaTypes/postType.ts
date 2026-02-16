import { defineField, defineType } from 'sanity'
import { GenerateImageInput } from '../components/GenerateImageInput'

export const postType = defineType({
  name: 'post',
  title: 'Artikel',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Auteur',
      type: 'string',
      initialValue: 'DeZestien Redactie',
    }),
    defineField({
      name: 'imagePrompt',
      title: 'AI Image Prompt',
      type: 'string',
      description: 'De prompt die gebruikt is om de afbeelding te genereren.',
    }),
    defineField({
      name: 'mainImage',
      title: 'Hoofdafbeelding (Hero)',
      type: 'image',
      options: {
        hotspot: true,
      },
      components: {
        input: GenerateImageInput
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        }
      ]
    }),
    defineField({
      name: 'category',
      title: 'Hoofdcategorie',
      type: 'string',
      options: {
        list: [
          { title: 'Nieuws', value: 'Nieuws' },
          { title: 'Eredivisie', value: 'Eredivisie' },
          { title: 'Champions League', value: 'Champions League' },
          { title: 'Europa League', value: 'Europa League' },
          { title: 'Conference League', value: 'Conference League' },
          { title: 'Oranje', value: 'Oranje' },
          { title: 'Transfers', value: 'Transfers' },
          { title: 'Buitenland', value: 'Buitenland' },
          { title: 'Eerste Divisie', value: 'Eerste Divisie' },
          { title: 'Vrouwenvoetbal', value: 'Vrouwenvoetbal' },
          { title: 'Analyse', value: 'Analyse' },
          { title: 'Opinie', value: 'Opinie' },
          { title: 'Podcast', value: 'Podcast' },
          { title: 'Gerucht', value: 'Gerucht' },
          { title: 'Video', value: 'Video' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'additionalCategories',
      title: 'Extra Labels / Tags',
      description: 'Selecteer extra labels',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          { title: 'Nieuws', value: 'Nieuws' },
          { title: 'Eredivisie', value: 'Eredivisie' },
          { title: 'Champions League', value: 'Champions League' },
          { title: 'Europa League', value: 'Europa League' },
          { title: 'Conference League', value: 'Conference League' },
          { title: 'Oranje', value: 'Oranje' },
          { title: 'Transfers', value: 'Transfers' },
          { title: 'Buitenland', value: 'Buitenland' },
          { title: 'Eerste Divisie', value: 'Eerste Divisie' },
          { title: 'Vrouwenvoetbal', value: 'Vrouwenvoetbal' },
          { title: 'Analyse', value: 'Analyse' },
          { title: 'Opinie', value: 'Opinie' },
          { title: 'Podcast', value: 'Podcast' },
          { title: 'Gerucht', value: 'Gerucht' },
          { title: 'Video', value: 'Video' },
        ]
      }
    }),
    defineField({
      name: 'club',
      title: 'Club',
      description: 'Primaire club waar dit artikel over gaat',
      type: 'string',
      options: {
        list: [
          // Eredivisie
          { title: 'Ajax', value: 'Ajax' },
          { title: 'PSV', value: 'PSV' },
          { title: 'Feyenoord', value: 'Feyenoord' },
          { title: 'AZ', value: 'AZ' },
          { title: 'FC Twente', value: 'FC Twente' },
          { title: 'FC Utrecht', value: 'FC Utrecht' },
          { title: 'Vitesse', value: 'Vitesse' },
          { title: 'sc Heerenveen', value: 'sc Heerenveen' },
          { title: 'FC Groningen', value: 'FC Groningen' },
          { title: 'Sparta Rotterdam', value: 'Sparta Rotterdam' },
          { title: 'NEC', value: 'NEC' },
          { title: 'Go Ahead Eagles', value: 'Go Ahead Eagles' },
          { title: 'Heracles Almelo', value: 'Heracles Almelo' },
          { title: 'Willem II', value: 'Willem II' },
          { title: 'Fortuna Sittard', value: 'Fortuna Sittard' },
          { title: 'PEC Zwolle', value: 'PEC Zwolle' },
          { title: 'RKC Waalwijk', value: 'RKC Waalwijk' },
          { title: 'NAC Breda', value: 'NAC Breda' },
          // Internationaal
          { title: 'Nederlands Elftal', value: 'Nederlands Elftal' },
          { title: 'Oranje Leeuwinnen', value: 'Oranje Leeuwinnen' },
          // Overig
          { title: 'Overig', value: 'Overig' },
        ],
      },
    }),
    defineField({
      name: 'competition',
      title: 'Competitie',
      description: 'Bijbehorende competitie',
      type: 'string',
      options: {
        list: [
          { title: 'Eredivisie', value: 'Eredivisie' },
          { title: 'Eerste Divisie', value: 'Eerste Divisie' },
          { title: 'KNVB Beker', value: 'KNVB Beker' },
          { title: 'Champions League', value: 'Champions League' },
          { title: 'Europa League', value: 'Europa League' },
          { title: 'Conference League', value: 'Conference League' },
          { title: 'EK', value: 'EK' },
          { title: 'WK', value: 'WK' },
          { title: 'Nations League', value: 'Nations League' },
          { title: 'Premier League', value: 'Premier League' },
          { title: 'La Liga', value: 'La Liga' },
          { title: 'Bundesliga', value: 'Bundesliga' },
          { title: 'Serie A', value: 'Serie A' },
          { title: 'Ligue 1', value: 'Ligue 1' },
          { title: 'Jupiler Pro League', value: 'Jupiler Pro League' },
        ],
      },
    }),
    defineField({
      name: 'matchResult',
      title: 'Wedstrijduitslag',
      description: 'Bijv. "Ajax 2-1 PSV"',
      type: 'string',
    }),
    defineField({
      name: 'youtubeEmbed',
      title: 'YouTube Video',
      description: 'YouTube URL voor embed (highlights, interviews)',
      type: 'url',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Gepubliceerd op',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'specialType',
      title: 'Special Type',
      description: 'Type terugkerend special',
      type: 'string',
      options: {
        list: [
          { title: 'Speelronde Samenvatting', value: 'speelronde-samenvatting' },
          { title: 'Transferupdate', value: 'transferupdate' },
          { title: 'Weekoverzicht', value: 'weekoverzicht' },
          { title: 'Vooruitblik', value: 'vooruitblik' },
          { title: 'Vandaag in Voetbalgeschiedenis', value: 'voetbalgeschiedenis' },
        ],
      },
      hidden: ({document}) => !document?.specialType,
    }),
    defineField({
      name: 'originalUrl',
      title: 'Original Source URL',
      type: 'url',
      hidden: true,
    }),
    defineField({
      name: 'excerpt',
      title: 'Samenvatting (Intro/Lead)',
      description: 'Korte tekst voor lijstweergave en bovenaan het artikel.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'body',
      title: 'Artikel Inhoud',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Kop 2', value: 'h2' },
            { title: 'Kop 3', value: 'h3' },
            { title: 'Kop 4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
              { title: 'Underline', value: 'underline' },
              { title: 'Strike', value: 'strike-through' },
            ],
            annotations: [
              {
                title: 'URL',
                name: 'link',
                type: 'object',
                fields: [
                  {
                    title: 'URL',
                    name: 'href',
                    type: 'url',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Onderschrift',
            },
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            }
          ]
        },
        {
          name: 'externalImage',
          type: 'object',
          title: 'Externe Afbeelding',
          fields: [
            {
              name: 'url',
              type: 'url',
              title: 'Afbeelding URL'
            },
            {
              name: 'alt',
              type: 'string',
              title: 'Beschrijving'
            }
          ]
        },
        {
          name: 'youtube',
          type: 'object',
          title: 'YouTube Embed',
          fields: [
            {
              name: 'url',
              type: 'url',
              title: 'YouTube Video URL'
            }
          ]
        },
        {
          name: 'twitter',
          type: 'object',
          title: 'Twitter Embed',
          fields: [
            {
              name: 'url',
              type: 'url',
              title: 'Twitter/X Post URL'
            }
          ]
        },
      ],
    }),
    defineField({
      name: 'isHot',
      title: 'Is Hot / Trending?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Titel',
      description: 'Optionele SEO-titel (als anders dan artikeltitel)',
      type: 'string',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Beschrijving',
      description: 'Meta description voor zoekmachines (max 160 tekens)',
      type: 'string',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
  ],
})
