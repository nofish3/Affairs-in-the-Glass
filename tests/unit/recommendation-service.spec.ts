import { describe, expect, it } from 'vitest';
import { COCKTAILS } from '../../miniprogram/data/cocktails';
import { getNextRecommendation, recommend } from '../../miniprogram/services/recommendation-service';
import type { Cocktail, Preference } from '../../miniprogram/types/domain';

const preference: Preference = {
  tastes: { sour: 3, sweet: 1 },
  aroma: 'fruity',
  alcoholFeeling: 'medium',
  texture: 'refreshing'
};

describe('recommendation service', () => {
  it('rejects incomplete preferences and empty data', () => {
    expect(recommend({ tastes: {}, aroma: null, alcoholFeeling: null, texture: null }, COCKTAILS)).toBeNull();
    expect(recommend(preference, [])).toBeNull();
  });

  it('returns one enabled cocktail with factual reasons', () => {
    const result = recommend(preference, COCKTAILS, new Set(), () => 0);
    expect(result).not.toBeNull();
    const cocktail = COCKTAILS.find((item) => item.id === result?.cocktailId);
    expect(cocktail?.enabled).toBe(true);
    expect(result?.reasons.length).toBeGreaterThan(0);
    expect(result?.reasons.length).toBeLessThanOrEqual(4);
  });

  it('does not constrain random dimensions', () => {
    const randomPreference: Preference = {
      tastes: { sour: 3 }, aroma: 'random', alcoholFeeling: 'random', texture: 'random'
    };
    const result = recommend(randomPreference, COCKTAILS, new Set(), () => 0);
    expect(result).not.toBeNull();
    expect(result?.reasons.every((reason) => reason.dimension === 'taste')).toBe(true);
  });

  it('protects a soft alcohol preference in strict matching', () => {
    const strong: Cocktail = { ...COCKTAILS.find((item) => item.id === 'daiquiri')!, id: 'strong-test', alcoholFeeling: 'strong' };
    const soft: Cocktail = { ...strong, id: 'soft-test', alcoholFeeling: 'soft', popularity: 1 };
    const result = recommend({ tastes: { sour: 3 }, aroma: 'random', alcoholFeeling: 'soft', texture: 'random' }, [strong, soft], new Set(), () => 0);
    expect(result?.cocktailId).toBe('soft-test');
    expect(result?.matchType).toBe('strict');
  });

  it('relaxes secondary dimensions when no strict candidate exists', () => {
    const only: Cocktail = { ...COCKTAILS.find((item) => item.enabled)!, taste: { sour: 0, sweet: 0, bitter: 0, salty: 0, umami: 0, spicy: 0 } };
    const result = recommend({ tastes: { sour: 3 }, aroma: 'creamy', alcoholFeeling: 'strong', texture: 'rich' }, [only], new Set(), () => 0);
    expect(result?.matchType).toBe('relaxed');
  });

  it('excludes shown cocktails and avoids immediately repeating after exhaustion', () => {
    const enabled = COCKTAILS.filter((item) => item.enabled).slice(0, 3);
    const first = recommend(preference, enabled, new Set(), () => 0)!;
    const next = getNextRecommendation(preference, enabled, [first.cocktailId], first.cocktailId, () => 0);
    expect(next?.cocktailId).not.toBe(first.cocktailId);

    const exhausted = getNextRecommendation(preference, enabled, enabled.map((item) => item.id), first.cocktailId, () => 0);
    expect(exhausted?.cocktailId).not.toBe(first.cocktailId);
  });
});
