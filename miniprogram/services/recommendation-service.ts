import {
  ALCOHOL_FEELINGS,
  type AlcoholFeeling,
  type Cocktail,
  type Preference,
  type RecommendationReason,
  type RecommendationResult,
  type TasteKey,
  type TasteLevel
} from '../types/domain';
import { ALCOHOL_LABELS, AROMA_LABELS, LEVEL_LABELS, TASTE_LABELS, TEXTURE_LABELS } from '../data/labels';
import { validatePreference } from '../utils/validation';

const WEIGHTS = { taste: 0.5, alcohol: 0.2, aroma: 0.15, texture: 0.15 } as const;
const STRICT_THRESHOLD = 0.65;
const CANDIDATE_WINDOW = 0.1;
const CANDIDATE_LIMIT = 5;

interface ScoredCocktail {
  cocktail: Cocktail;
  score: number;
  strict: boolean;
  reasons: RecommendationReason[];
}

function alcoholDistance(requested: AlcoholFeeling, actual: AlcoholFeeling): number {
  return Math.abs(ALCOHOL_FEELINGS.indexOf(requested) - ALCOHOL_FEELINGS.indexOf(actual));
}

function levelMatch(requested: TasteLevel, actual: TasteLevel): 'exact' | 'near' | 'relaxed' {
  const distance = Math.abs(requested - actual);
  return distance === 0 ? 'exact' : distance === 1 ? 'near' : 'relaxed';
}

function tasteReason(key: TasteKey, requested: TasteLevel, actual: TasteLevel): RecommendationReason {
  const match = levelMatch(requested, actual);
  const adjective = match === 'exact' ? '正好' : match === 'near' ? '接近' : '最接近';
  return {
    dimension: 'taste',
    match,
    text: `你选择了${TASTE_LABELS[key]}味${LEVEL_LABELS[requested]}，这杯的${TASTE_LABELS[key]}味为${LEVEL_LABELS[actual]}，${adjective}你想要的程度。`
  };
}

function scoreCocktail(preference: Preference, cocktail: Cocktail): ScoredCocktail {
  const selectedTastes = Object.entries(preference.tastes) as Array<[TasteKey, 1 | 2 | 3]>;
  const tasteDistance = selectedTastes.reduce(
    (sum, [key, requested]) => sum + Math.abs(requested - cocktail.taste[key]),
    0
  ) / selectedTastes.length;
  const tasteScore = 1 - tasteDistance / 3;

  const parts: Array<{ score: number; weight: number }> = [{ score: tasteScore, weight: WEIGHTS.taste }];
  const reasons: RecommendationReason[] = selectedTastes
    .map(([key, requested]) => tasteReason(key, requested, cocktail.taste[key]))
    .sort((a, b) => (a.match === 'exact' ? -1 : b.match === 'exact' ? 1 : 0))
    .slice(0, 2);

  if (preference.alcoholFeeling !== 'random' && preference.alcoholFeeling !== null) {
    const distance = alcoholDistance(preference.alcoholFeeling, cocktail.alcoholFeeling);
    parts.push({ score: distance === 0 ? 1 : distance === 1 ? 0.5 : 0, weight: WEIGHTS.alcohol });
    reasons.push({
      dimension: 'alcohol',
      match: distance === 0 ? 'exact' : distance === 1 ? 'near' : 'relaxed',
      text: `你选择了${ALCOHOL_LABELS[preference.alcoholFeeling]}酒感，这杯的酒感为${ALCOHOL_LABELS[cocktail.alcoholFeeling]}。`
    });
  }

  if (preference.aroma !== 'random' && preference.aroma !== null) {
    const exact = cocktail.aromas.includes(preference.aroma);
    parts.push({ score: exact ? 1 : 0, weight: WEIGHTS.aroma });
    reasons.push({
      dimension: 'aroma',
      match: exact ? 'exact' : 'relaxed',
      text: exact
        ? `你选择了${AROMA_LABELS[preference.aroma]}，这杯也以${AROMA_LABELS[preference.aroma]}为主要气息。`
        : `这杯以${AROMA_LABELS[cocktail.primaryAroma]}为主香，是现有酒款中较接近的选择。`
    });
  }

  if (preference.texture !== 'random' && preference.texture !== null) {
    const exact = cocktail.texture === preference.texture;
    parts.push({ score: exact ? 1 : 0, weight: WEIGHTS.texture });
    reasons.push({
      dimension: 'texture',
      match: exact ? 'exact' : 'relaxed',
      text: exact
        ? `你想要${TEXTURE_LABELS[preference.texture]}的口感，这杯正是${TEXTURE_LABELS[cocktail.texture]}型。`
        : `这杯的口感更偏${TEXTURE_LABELS[cocktail.texture]}，是当前条件下较接近的选择。`
    });
  }

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  const score = parts.reduce((sum, part) => sum + part.score * part.weight, 0) / totalWeight;
  const hasNearTaste = selectedTastes.some(([key, requested]) => Math.abs(requested - cocktail.taste[key]) <= 1);
  const violatesSoftAlcohol = preference.alcoholFeeling === 'soft' && cocktail.alcoholFeeling === 'strong';

  return {
    cocktail,
    score,
    strict: score >= STRICT_THRESHOLD && hasNearTaste && !violatesSoftAlcohol,
    reasons
  };
}

function chooseCandidate(items: ScoredCocktail[], rng: () => number): ScoredCocktail | null {
  if (!items.length) return null;
  const sorted = [...items].sort((a, b) => b.score - a.score || b.cocktail.popularity - a.cocktail.popularity);
  const best = sorted[0]?.score ?? 0;
  const pool = sorted
    .filter((item) => best - item.score <= CANDIDATE_WINDOW)
    .slice(0, CANDIDATE_LIMIT);
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[index] ?? null;
}

export function recommend(
  preference: Preference,
  cocktails: Cocktail[],
  excludedIds: Set<string> = new Set(),
  rng: () => number = Math.random
): RecommendationResult | null {
  if (!validatePreference(preference).valid) return null;

  const enabled = cocktails.filter((cocktail) => cocktail.enabled && !excludedIds.has(cocktail.id));
  const scored = enabled.map((cocktail) => scoreCocktail(preference, cocktail));
  const strict = scored.filter((item) => item.strict);
  const matchType = strict.length ? 'strict' : 'relaxed';
  const chosen = chooseCandidate(strict.length ? strict : scored, rng);

  if (!chosen) return null;
  return {
    cocktailId: chosen.cocktail.id,
    score: Number(chosen.score.toFixed(4)),
    matchType,
    reasons: chosen.reasons
      .filter((reason) => matchType === 'relaxed' || reason.match !== 'relaxed')
      .slice(0, 4)
  };
}

export function getNextRecommendation(
  preference: Preference,
  cocktails: Cocktail[],
  shownCocktailIds: string[],
  currentId?: string,
  rng: () => number = Math.random
): RecommendationResult | null {
  let result = recommend(preference, cocktails, new Set(shownCocktailIds), rng);
  if (result) return result;

  const resetExclusions = new Set(currentId ? [currentId] : []);
  result = recommend(preference, cocktails, resetExclusions, rng);
  return result;
}

