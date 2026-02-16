import { defineField, defineType } from 'sanity'

export const navigationType = defineType({
  name: 'navigationType',
  title: 'Navigatie Item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
    }),
    defineField({
      name: 'href',
      title: 'URL',
      type: 'string',
    }),
  ],
})
