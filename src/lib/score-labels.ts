/**
 * Bepaalt het juiste high-score label op basis van categorie.
 *
 * - Review / Indie → "MUST PLAY" (game-gerelateerd)
 * - Hardware / Tech → "MUST HAVE" (product-gerelateerd)
 * - Overige categorieën → null (geen label)
 */
export function getHighScoreLabel(
  category: string,
  score: number,
  reviewType?: string
): { text: string; emoji: string } | null {
  if (score < 90) return null;

  const cat = category?.toLowerCase();

  // Film/serie reviews → MUST WATCH
  if (reviewType === 'film_serie') {
    return { text: 'MUST WATCH', emoji: '🎬' };
  }

  // Hardware reviews → MUST HAVE
  if (reviewType === 'hardware' || ['hardware', 'tech'].includes(cat)) {
    return { text: 'MUST HAVE', emoji: '🏆' };
  }

  if (['review', 'indie'].includes(cat)) {
    return { text: 'MUST PLAY', emoji: '🔥' };
  }

  return null;
}
