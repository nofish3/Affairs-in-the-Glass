import { describe, expect, it } from 'vitest';
import { COCKTAILS } from '../../miniprogram/data/cocktails';
import { INGREDIENTS } from '../../miniprogram/data/ingredients';
import { recognizeInput } from '../../miniprogram/services/recognition-service';

describe('recognition service', () => {
  const enabledCocktailAliases = COCKTAILS
    .filter((cocktail) => cocktail.enabled)
    .flatMap((cocktail) => [...new Set([cocktail.name, cocktail.englishName, ...cocktail.aliases])]
      .map((alias) => [alias, cocktail.id] as const));

  it('handles empty and punctuation-only input', () => {
    expect(recognizeInput('   ', COCKTAILS, INGREDIENTS).type).toBe('empty');
    expect(recognizeInput('，、 /', COCKTAILS, INGREDIENTS).type).toBe('not-found');
  });

  it.each([
    ['尼格罗尼', 'negroni'],
    ['OLD FASHIONED', 'old-fashioned'],
    ['Ｇ＆Ｔ', 'gin-tonic']
  ])('recognizes cocktail alias %s', (input, id) => {
    const result = recognizeInput(input, COCKTAILS, INGREDIENTS);
    expect(result.type).toBe('cocktail');
    if (result.type === 'cocktail') expect(result.cocktailId).toBe(id);
  });

  it.each(enabledCocktailAliases)('recognizes enabled cocktail name or alias %s', (input, id) => {
    const result = recognizeInput(input, COCKTAILS, INGREDIENTS);
    expect(result.type).toBe('cocktail');
    if (result.type === 'cocktail') expect(result.cocktailId).toBe(id);
  });

  it('prioritizes a cocktail name and keeps extra ingredients', () => {
    const result = recognizeInput('威士忌酸 蜂蜜', COCKTAILS, INGREDIENTS);
    expect(result.type).toBe('cocktail');
    if (result.type === 'cocktail') {
      expect(result.cocktailId).toBe('whiskey-sour');
      expect(result.recognizedExtraIngredientIds).toContain('honey-syrup');
    }
  });

  it.each(['威士忌，青柠', '威士忌,青柠', '威士忌、青柠', '威士忌;青柠；蜂蜜', '威士忌/青柠／蜂蜜', '威士忌\n青柠\t蜂蜜'])('supports separators: %s', (input) => {
    const result = recognizeInput(input, COCKTAILS, INGREDIENTS);
    expect(result.type).toBe('ingredient-combination');
    if (result.type === 'ingredient-combination') {
      expect(result.recognizedIngredientIds).toContain('whiskey');
      expect(result.recognizedIngredientIds).toContain('lime-juice');
    }
  });

  it('recognizes a base spirit or a single ordinary ingredient', () => {
    const whiskey = recognizeInput('威士忌', COCKTAILS, INGREDIENTS);
    const lime = recognizeInput('青柠', COCKTAILS, INGREDIENTS);
    expect(whiskey.type).toBe('ingredient-combination');
    expect(lime.type).toBe('ingredient-combination');
  });

  it('deduplicates ingredients and reports unknown tokens', () => {
    const result = recognizeInput('青柠、青柠、月光糖浆', COCKTAILS, INGREDIENTS);
    expect(result.type).toBe('ingredient-combination');
    if (result.type === 'ingredient-combination') {
      expect(result.recognizedIngredientIds.filter((id) => id === 'lime-juice')).toHaveLength(1);
      expect(result.unrecognizedTokens).toContain('月光糖浆');
    }
  });

  it('does not invent a result for unknown or overlong input', () => {
    expect(recognizeInput('月光酒', COCKTAILS, INGREDIENTS).type).toBe('not-found');
    expect(recognizeInput('x'.repeat(501), COCKTAILS, INGREDIENTS).type).toBe('not-found');
  });
});
