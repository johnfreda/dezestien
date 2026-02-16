import { defineField, defineType } from 'sanity'

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigatie',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Menu Naam',
      type: 'string',
    }),
    defineField({
      name: 'items',
      title: 'Menu Items',
      type: 'array',
      of: [{ type: 'navigationType' }],
    }),
  ],
})
