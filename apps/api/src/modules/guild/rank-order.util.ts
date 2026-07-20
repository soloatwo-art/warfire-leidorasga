/**
 * Known RubinOT guild ranks ordered from most to least senior. Any rank not
 * in this list (custom guild ranks) is treated as equal to "Member", the
 * lowest rung, so promotions/demotions against custom ranks still resolve to
 * a sensible direction instead of throwing.
 */
const KNOWN_RANK_ORDER = ["Leader", "Commander", "Elite", "Member"];

export function rankSeniority(rank: string): number {
  const index = KNOWN_RANK_ORDER.indexOf(rank);
  return index === -1 ? KNOWN_RANK_ORDER.length - 1 : index;
}

/** Returns true if `newRank` is more senior than `oldRank`. */
export function isPromotion(oldRank: string, newRank: string): boolean {
  return rankSeniority(newRank) < rankSeniority(oldRank);
}
