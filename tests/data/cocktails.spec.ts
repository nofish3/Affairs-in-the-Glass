import { describe, expect, it } from 'vitest';
import { COCKTAILS } from '../../miniprogram/data/cocktails';
import { INGREDIENTS } from '../../miniprogram/data/ingredients';
import { RECIPE_SOURCE_BY_COCKTAIL_ID } from '../../miniprogram/data/recipe-sources';
import { TASTE_KEYS } from '../../miniprogram/types/domain';
import { buildAliasIndex, findAliasConflicts } from '../../miniprogram/services/recognition-service';

describe('cocktail data quality', () => {
  it('ships 40 sourced cocktails and keeps drafts disabled', () => {
    const enabled = COCKTAILS.filter((item) => item.enabled);
    expect(enabled).toHaveLength(40);
    enabled.forEach((item) => expect(RECIPE_SOURCE_BY_COCKTAIL_ID.has(item.id)).toBe(true));
  });

  it('uses unique ids and valid ingredient references', () => {
    expect(new Set(COCKTAILS.map((item) => item.id)).size).toBe(COCKTAILS.length);
    expect(new Set(INGREDIENTS.map((item) => item.id)).size).toBe(INGREDIENTS.length);
    const ingredientIds = new Set(INGREDIENTS.map((item) => item.id));
    COCKTAILS.forEach((cocktail) => {
      cocktail.ingredientIds.forEach((id) => expect(ingredientIds.has(id), `${cocktail.id}:${id}`).toBe(true));
    });
  });

  it('has complete flavor values and a valid primary aroma', () => {
    COCKTAILS.forEach((cocktail) => {
      expect(cocktail.aromas).toContain(cocktail.primaryAroma);
      TASTE_KEYS.forEach((key) => {
        expect(cocktail.taste[key]).toBeGreaterThanOrEqual(0);
        expect(cocktail.taste[key]).toBeLessThanOrEqual(3);
      });
      expect(cocktail.name.trim()).not.toBe('');
      expect(cocktail.summary.trim()).not.toBe('');
      expect(cocktail.feeling.trim()).not.toBe('');
    });
  });

  it('does not contain normalized alias conflicts in enabled data', () => {
    const index = buildAliasIndex(COCKTAILS, INGREDIENTS);
    expect(findAliasConflicts(index)).toEqual([]);
  });
});

