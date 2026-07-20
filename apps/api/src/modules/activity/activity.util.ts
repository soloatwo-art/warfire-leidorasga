import { ActivityLevel } from "@warfire/shared";

export interface ActivityResult {
  level: ActivityLevel;
  daysSinceLastActivity: number | null;
}

/**
 * Guild Activity score. We only have two real signals from RubinOT: the
 * last time a character was seen online, and the last time it leveled up.
 * Whichever is most recent wins as "last activity".
 */
export function computeActivity(
  lastSeenOnlineAt: Date | null,
  lastLevelUpAt: Date | null,
  now: Date = new Date(),
): ActivityResult {
  const timestamps = [lastSeenOnlineAt, lastLevelUpAt].filter((d): d is Date => d !== null);
  if (timestamps.length === 0) {
    return { level: ActivityLevel.SEM_ATIVIDADE, daysSinceLastActivity: null };
  }

  const mostRecent = new Date(Math.max(...timestamps.map((d) => d.getTime())));
  const daysSince = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));

  let level: ActivityLevel;
  if (daysSince <= 1) level = ActivityLevel.MUITO_ATIVO;
  else if (daysSince <= 3) level = ActivityLevel.ATIVO;
  else if (daysSince <= 7) level = ActivityLevel.POUCO_ATIVO;
  else if (daysSince <= 14) level = ActivityLevel.INATIVO;
  else level = ActivityLevel.SEM_ATIVIDADE;

  return { level, daysSinceLastActivity: daysSince };
}
