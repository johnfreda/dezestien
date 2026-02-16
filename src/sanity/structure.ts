import type {StructureBuilder} from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // 1. Alle Berichten
      S.documentTypeListItem('post').title('Alle Berichten'),

      S.divider(),

      // 2. Eredivisie
      S.listItem()
        .title('Eredivisie')
        .child(
          S.documentList()
            .title('Eredivisie')
            .filter('_type == "post" && category == "Eredivisie"')
        ),

      // 3. Nieuws
      S.listItem()
        .title('Nieuws')
        .child(
          S.documentList()
            .title('Nieuws')
            .filter('_type == "post" && (category == "Nieuws" || !defined(category))')
        ),

      // 4. Champions League
      S.listItem()
        .title('Champions League')
        .child(
          S.documentList()
            .title('Champions League')
            .filter('_type == "post" && category == "Champions League"')
        ),

      // 5. Transfers
      S.listItem()
        .title('Transfers')
        .child(
          S.documentList()
            .title('Transfers')
            .filter('_type == "post" && category == "Transfers"')
        ),

      // 6. Oranje
      S.listItem()
        .title('Oranje')
        .child(
          S.documentList()
            .title('Oranje')
            .filter('_type == "post" && category == "Oranje"')
        ),

      // 7. Buitenland
      S.listItem()
        .title('Buitenland')
        .child(
          S.documentList()
            .title('Buitenland')
            .filter('_type == "post" && category == "Buitenland"')
        ),

      // 8. Analyse
      S.listItem()
        .title('Analyse')
        .child(
          S.documentList()
            .title('Analyse')
            .filter('_type == "post" && category == "Analyse"')
        ),

      // 9. Geruchten
      S.listItem()
        .title('Geruchten')
        .child(
          S.documentList()
            .title('Geruchten')
            .filter('_type == "post" && category == "Gerucht"')
        ),

      // 10. Opinie
      S.listItem()
        .title('Opinie')
        .child(
          S.documentList()
            .title('Opinie')
            .filter('_type == "post" && category == "Opinie"')
        ),

      // 11. Vrouwenvoetbal
      S.listItem()
        .title('Vrouwenvoetbal')
        .child(
          S.documentList()
            .title('Vrouwenvoetbal')
            .filter('_type == "post" && category == "Vrouwenvoetbal"')
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

      // Overige document types
      ...S.documentTypeListItems().filter(
        (listItem) => listItem.getId() !== 'post' && listItem.getId() !== 'tip' && listItem.getId() !== 'podcastShow'
      ),
    ])
