import { ALCOHOL_FEELINGS, TASTE_KEYS, type AlcoholFeeling, type Ingredient, type IngredientRecognitionResult, type TasteKey, type TasteLevel, type Texture } from '../types/domain';
import { ALCOHOL_LABELS, AROMA_LABELS, LEVEL_LABELS, TASTE_LABELS, TEXTURE_LABELS } from '../data/labels';

function estimateTaste(ingredients: Ingredient[]): Record<TasteKey, TasteLevel> {
  return Object.fromEntries(TASTE_KEYS.map((key) => {
    const contributions = ingredients
      .map((ingredient) => ingredient.tasteContribution[key] ?? 0)
      .sort((a, b) => b - a);
    const highest = contributions[0] ?? 0;
    const second = contributions[1] ?? 0;
    const estimate = contributions.length === 1
      ? highest
      : Math.round(highest * 0.7 + second * 0.3);
    return [key, Math.max(0, Math.min(3, estimate)) as TasteLevel];
  })) as Record<TasteKey, TasteLevel>;
}

function estimateAlcohol(ingredients: Ingredient[]): AlcoholFeeling | null {
  const strengths = ingredients.map((item) => item.alcoholStrength).filter((value) => value > 0);
  if (!strengths.length) return null;
  const strongCount = strengths.filter((value) => value === 3).length;
  const max = Math.max(...strengths);
  const adjusted = Math.min(3, max + (strongCount >= 2 ? 1 : 0));
  return ALCOHOL_FEELINGS[Math.max(0, adjusted - 1)] ?? 'soft';
}

function estimateTexture(ingredients: Ingredient[]): Texture | null {
  const scores: Record<Texture, number> = { refreshing: 0, smooth: 0, rich: 0 };
  ingredients.forEach((ingredient) => {
    ingredient.textureContributions.forEach((texture) => { scores[texture] += 1; });
    if (ingredient.category === 'dairy') scores.rich += 2;
    if (ingredient.category === 'mixer' && ingredient.id !== 'coffee') scores.refreshing += 1;
    if (ingredient.category === 'syrup') scores.smooth += 1;
  });
  const ranked = (Object.entries(scores) as Array<[Texture, number]>).sort((a, b) => b[1] - a[1]);
  if (!ranked[0] || ranked[0][1] === 0) return null;
  return ranked[0][0];
}

export function analyzeIngredientCombination(
  ingredients: Ingredient[],
  unrecognizedTokens: string[] = []
): IngredientRecognitionResult {
  const unique = [...new Map(ingredients.map((item) => [item.id, item])).values()];
  const estimatedTaste = estimateTaste(unique);
  const aromas = [...new Set(unique.flatMap((item) => item.aromas))].slice(0, 3);
  const alcoholFeeling = estimateAlcohol(unique);
  const texture = estimateTexture(unique);
  const dominantTastes = TASTE_KEYS
    .filter((key) => estimatedTaste[key] > 0)
    .sort((a, b) => estimatedTaste[b] - estimatedTaste[a])
    .slice(0, 3);

  const tasteText = dominantTastes.length
    ? dominantTastes.map((key) => `${TASTE_LABELS[key]}味${LEVEL_LABELS[estimatedTaste[key]]}`).join('、')
    : '味道较为中性';
  const aromaText = aromas.length ? aromas.map((item) => AROMA_LABELS[item]).join('、') : '香气较淡';
  const alcoholText = alcoholFeeling ? `酒感${ALCOHOL_LABELS[alcoholFeeling]}` : '没有明显酒感';
  const textureText = texture ? `口感偏${TEXTURE_LABELS[texture]}` : '口感难以判断';

  return {
    type: 'ingredient-combination',
    recognizedIngredientIds: unique.map((item) => item.id),
    unrecognizedTokens,
    estimatedTaste,
    aromas,
    alcoholFeeling,
    texture,
    summary: `${tasteText}，以${aromaText}为主，${alcoholText}，${textureText}。`,
    feeling: unique.length === 1
      ? unique[0]?.standaloneSummary ?? ''
      : `这些材料放在一起，${unique.map((item) => item.name).join('、')}会各自留下作用；实际味道仍会随比例、品牌和调制方式改变。`
  };
}

