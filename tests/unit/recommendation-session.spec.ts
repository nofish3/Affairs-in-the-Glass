import { beforeEach, describe, expect, it } from 'vitest';
import { clearRecommendationSession, getRecommendationSession, setCurrentRecommendation, setPreference } from '../../miniprogram/stores/recommendation-session';

const preference = {
  tastes: { sour: 2 as const },
  aroma: 'fruity' as const,
  alcoholFeeling: 'soft' as const,
  texture: 'refreshing' as const
};

describe('recommendation session', () => {
  beforeEach(clearRecommendationSession);

  it('starts clean and records unique shown cocktails', () => {
    setPreference(preference);
    setCurrentRecommendation({ cocktailId: 'a', score: 1, matchType: 'strict', reasons: [] });
    setCurrentRecommendation({ cocktailId: 'a', score: 1, matchType: 'strict', reasons: [] }, true);
    expect(getRecommendationSession()?.shownCocktailIds).toEqual(['a']);
    expect(getRecommendationSession()?.changeCount).toBe(1);
  });

  it('counts only changes and reaches the prompt threshold on the third change', () => {
    setPreference(preference);
    setCurrentRecommendation({ cocktailId: 'first', score: 1, matchType: 'strict', reasons: [] });
    ['second', 'third', 'fourth'].forEach((cocktailId) => {
      setCurrentRecommendation({ cocktailId, score: 1, matchType: 'strict', reasons: [] }, true);
    });
    expect(getRecommendationSession()?.changeCount).toBe(3);
    expect(getRecommendationSession()?.shownCocktailIds).toEqual(['first', 'second', 'third', 'fourth']);
  });

  it('replacing the preference resets the result and change history', () => {
    setPreference(preference);
    setCurrentRecommendation({ cocktailId: 'a', score: 1, matchType: 'strict', reasons: [] }, true);
    setPreference({ ...preference, tastes: { sweet: 1 } });
    expect(getRecommendationSession()).toMatchObject({ shownCocktailIds: [], changeCount: 0 });
    expect(getRecommendationSession()?.current).toBeUndefined();
  });
});

