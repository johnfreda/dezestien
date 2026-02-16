import type {StructureBuilder} from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // 1. Alle Berichten (standaard view)
      S.documentTypeListItem('post').title('Alle Berichten'),

      S.divider(),

      // 2. Filter: Reviews
      S.listItem()
        .title('Reviews')
        .child(
          S.documentList()
            .title('Reviews')
            .filter('_type == "post" && category == "Review"')
        ),

      // 3. Filter: Nieuws
      S.listItem()
        .title('Nieuws')
        .child(
          S.documentList()
            .title('Nieuws')
            .filter('_type == "post" && (category == "Nieuws" || !defined(category))')
        ),

      // 4. Filter: Features
      S.listItem()
        .title('Features')
        .child(
          S.documentList()
            .title('Features')
            .filter('_type == "post" && category == "Feature"')
        ),

      // 5. Filter: Hardware
      S.listItem()
        .title('Hardware')
        .child(
          S.documentList()
            .title('Hardware')
            .filter('_type == "post" && category == "Hardware"')
        ),

      // 6. Filter: Tech
      S.listItem()
        .title('Tech')
        .child(
          S.documentList()
            .title('Tech')
            .filter('_type == "post" && category == "Tech"')
        ),

      // 7. Filter: Indie
      S.listItem()
        .title('Indie')
        .child(
          S.documentList()
            .title('Indie')
            .filter('_type == "post" && category == "Indie"')
        ),

      // 8. Filter: Mods
      S.listItem()
        .title('Mods')
        .child(
          S.documentList()
            .title('Mods')
            .filter('_type == "post" && category == "Mods"')
        ),

      // 9. Filter: Geruchten
      S.listItem()
        .title('Geruchten')
        .child(
          S.documentList()
            .title('Geruchten')
            .filter('_type == "post" && category == "Gerucht"')
        ),

      // 10. Filter: Opinie
      S.listItem()
        .title('Opinie')
        .child(
          S.documentList()
            .title('Opinie')
            .filter('_type == "post" && category == "Opinie"')
        ),

      // 11. Podcasts (genest: Shows + Afleveringen)
      S.listItem()
        .title('Podcasts')
        .child(
          S.list()
            .title('Podcasts')
            .items([
              S.listItem()
                .title('Podcast Shows')
                .child(
                  S.documentList()
                    .title('Podcast Shows')
                    .filter('_type == "podcastShow"')
                ),
              S.listItem()
                .title('Alle Afleveringen')
                .child(
                  S.documentList()
                    .title('Podcast Afleveringen')
                    .filter('_type == "post" && category == "Podcast"')
                    .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                ),
            ])
        ),

      S.divider(),

      // 12. Nieuws Tips
      S.listItem()
        .title('📰 Nieuws Tips')
        .child(
          S.documentList()
            .title('Nieuws Tips van Bezoekers')
            .filter('_type == "tip"')
            .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
        ),

      S.divider(),

      // Toon de overige document types (behalve 'post' en 'tip' die we hierboven al handmatig hebben gedaan)
      ...S.documentTypeListItems().filter(
        (listItem) => listItem.getId() !== 'post' && listItem.getId() !== 'tip' && listItem.getId() !== 'podcastShow'
      ),
    ])
