import { type SchemaTypeDefinition } from 'sanity'
import { postType } from './postType'
import { podcastShowType } from './podcastShowType'
import { navigation } from './navigation'
import { navigationType } from './navigationType'
import { tipType } from './tipType'
import { commentInterestType } from './commentInterestType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [postType, podcastShowType, navigation, navigationType, tipType, commentInterestType],
}
