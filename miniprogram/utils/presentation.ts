import { ALCOHOL_LABELS, AROMA_LABELS, LEVEL_LABELS, TASTE_LABELS, TEXTURE_LABELS } from '../data/labels';
import { INGREDIENT_BY_ID } from '../data/ingredients';
import { TASTE_KEYS, type Cocktail, type IngredientRecognitionResult } from '../types/domain';

export function cocktailView(cocktail: Cocktail) {
  return {
    ...cocktail,
    ingredientNames: cocktail.ingredientIds.map((id) => INGREDIENT_BY_ID.get(id)?.name ?? id),
    tasteRows: TASTE_KEYS
      .filter((key) => cocktail.taste[key] > 0)
      .map((key) => ({ key, label: TASTE_LABELS[key], level: LEVEL_LABELS[cocktail.taste[key]] })),
    aromaLabel: cocktail.aromas.map((item) => AROMA_LABELS[item]).join('、'),
    alcoholLabel: ALCOHOL_LABELS[cocktail.alcoholFeeling],
    textureLabel: TEXTURE_LABELS[cocktail.texture]
  };
}

export function ingredientResultView(result: IngredientRecognitionResult) {
  return {
    ...result,
    recognizedNames: result.recognizedIngredientIds.map((id) => INGREDIENT_BY_ID.get(id)?.name ?? id),
    roles: result.recognizedIngredientIds.map((id) => {
      const ingredient = INGREDIENT_BY_ID.get(id);
      return { id, name: ingredient?.name ?? id, description: ingredient?.roleDescription ?? '' };
    }),
    tasteRows: TASTE_KEYS
      .filter((key) => result.estimatedTaste[key] > 0)
      .map((key) => ({ key, label: TASTE_LABELS[key], level: LEVEL_LABELS[result.estimatedTaste[key]] })),
    aromaLabel: result.aromas.length ? result.aromas.map((item) => AROMA_LABELS[item]).join('、') : '不明显',
    alcoholLabel: result.alcoholFeeling ? ALCOHOL_LABELS[result.alcoholFeeling] : '无明显酒感',
    textureLabel: result.texture ? TEXTURE_LABELS[result.texture] : '难以判断'
  };
}

