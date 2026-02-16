import { defineType, defineField } from 'sanity';

export const commentInterestType = defineType({
  name: 'commentInterest',
  title: 'Comment Interest',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'E-mail',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'articleSlug',
      title: 'Artikel Slug',
      type: 'string',
      description: 'Het artikel waar de interesse vandaan kwam',
    }),
    defineField({
      name: 'signedUpAt',
      title: 'Aangemeld op',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'email',
      subtitle: 'signedUpAt',
    },
  },
});
