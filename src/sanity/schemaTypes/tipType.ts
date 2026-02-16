import { defineField, defineType } from 'sanity'

export const tipType = defineType({
  name: 'tip',
  title: 'Nieuws Tip',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Bron URL',
      type: 'url',
    }),
    defineField({
      name: 'description',
      title: 'Beschrijving',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'category',
      title: 'Categorie',
      type: 'string',
      options: {
        list: [
          { title: 'Nieuws', value: 'Nieuws' },
          { title: 'Review', value: 'Review' },
          { title: 'Transfers', value: 'Transfers' },
          { title: 'Buitenland', value: 'Buitenland' },
          { title: 'Eredivisie', value: 'Eredivisie' },
          { title: 'Gerucht', value: 'Gerucht' },
        ],
      },
    }),
    defineField({
      name: 'submittedBy',
      title: 'Ingediend door',
      type: 'string',
    }),
    defineField({
      name: 'submittedAt',
      title: 'Ingediend op',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'In afwachting', value: 'pending' },
          { title: 'Goedgekeurd', value: 'approved' },
          { title: 'Afgewezen', value: 'rejected' },
        ],
      },
      initialValue: 'pending',
    }),
  ],
})
