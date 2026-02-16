import { defineField, defineType } from 'sanity'

export const podcastShowType = defineType({
  name: 'podcastShow',
  title: 'Podcast Show',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Show Naam',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Beschrijving',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Afbeelding',
      type: 'image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', type: 'string', title: 'Alt Text' },
      ],
    }),
    defineField({
      name: 'feedUrl',
      title: 'RSS Feed URL',
      description: 'De RSS feed URL van deze podcast (voor automatisch scannen)',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'spotifyShowUrl',
      title: 'Spotify Show URL',
      description: 'Link naar de Spotify showpagina',
      type: 'url',
    }),
    defineField({
      name: 'applePodcastUrl',
      title: 'Apple Podcasts URL',
      type: 'url',
    }),
    defineField({
      name: 'youtubeChannelUrl',
      title: 'YouTube Kanaal URL',
      type: 'url',
    }),
    defineField({
      name: 'youtubePlaylistUrl',
      title: 'YouTube Playlist URL',
      description: 'YouTube playlist om op de showpagina te embedden',
      type: 'url',
    }),
    defineField({
      name: 'youtubeChannelId',
      title: 'YouTube Channel ID',
      description: 'YouTube channel ID (bijv. UCEBmVNwdGQU2joqW7ZJv2fA) voor automatische video matching',
      type: 'string',
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website URL',
      type: 'url',
    }),
    defineField({
      name: 'active',
      title: 'Actief?',
      description: 'Inactieve shows worden niet automatisch gescand',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      media: 'coverImage',
    },
  },
})
