import type { Preference, RecommendationResult, RecommendationSession } from '../types/domain';

let session: RecommendationSession | null = null;

export function getRecommendationSession(): RecommendationSession | null {
  return session ? { ...session, shownCocktailIds: [...session.shownCocktailIds] } : null;
}

export function setPreference(preference: Preference): RecommendationSession {
  session = { preference, shownCocktailIds: [], changeCount: 0 };
  return getRecommendationSession()!;
}

export function setCurrentRecommendation(result: RecommendationResult, isChange = false): RecommendationSession {
  if (!session) throw new Error('推荐会话尚未开始');
  const shown = session.shownCocktailIds.includes(result.cocktailId)
    ? session.shownCocktailIds
    : [...session.shownCocktailIds, result.cocktailId];
  session = {
    ...session,
    current: result,
    shownCocktailIds: shown,
    changeCount: session.changeCount + (isChange ? 1 : 0)
  };
  return getRecommendationSession()!;
}

export function resetShownCocktails(keepCocktailId?: string): RecommendationSession {
  if (!session) throw new Error('推荐会话尚未开始');
  session = {
    ...session,
    shownCocktailIds: keepCocktailId ? [keepCocktailId] : []
  };
  return getRecommendationSession()!;
}

export function clearRecommendationSession(): void {
  session = null;
}
