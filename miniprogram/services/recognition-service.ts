import type { Cocktail, Ingredient, RecognitionResult } from '../types/domain';
import { analyzeIngredientCombination } from './combination-service';
import { normalizeSearchText, splitRemainingTokens } from '../utils/normalize-input';

interface AliasEntry {
  normalizedAlias: string;
  sourceAlias: string;
  entityType: 'cocktail' | 'ingredient';
  entityId: string;
}

const aliasIndexCache = new WeakMap<Cocktail[], WeakMap<Ingredient[], AliasEntry[]>>();

function isAsciiWord(char: string | undefined): boolean {
  return Boolean(char && /[a-z0-9]/i.test(char));
}

function isCjk(char: string | undefined): boolean {
  return Boolean(char && /[\u3400-\u9fff]/.test(char));
}

function hasAliasBoundaries(text: string, start: number, alias: string): boolean {
  const before = text[start - 1];
  const after = text[start + alias.length];
  if (/[a-z]/i.test(alias)) return !isAsciiWord(before) && !isAsciiWord(after);
  if (/[\u3400-\u9fff]/.test(alias)) return !isCjk(before) && !isCjk(after);
  return true;
}

export function buildAliasIndex(cocktails: Cocktail[], ingredients: Ingredient[]): AliasEntry[] {
  const entries: AliasEntry[] = [];
  cocktails.filter((item) => item.enabled).forEach((item) => {
    [...new Set([item.name, item.englishName, ...item.aliases])].forEach((alias) => entries.push({
      normalizedAlias: normalizeSearchText(alias),
      sourceAlias: alias,
      entityType: 'cocktail',
      entityId: item.id
    }));
  });
  ingredients.filter((item) => item.enabled).forEach((item) => {
    [...new Set([item.name, item.englishName, ...item.aliases].filter(Boolean) as string[])].forEach((alias) => entries.push({
      normalizedAlias: normalizeSearchText(alias),
      sourceAlias: alias,
      entityType: 'ingredient',
      entityId: item.id
    }));
  });
  return entries.sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);
}

function getAliasIndex(cocktails: Cocktail[], ingredients: Ingredient[]): AliasEntry[] {
  let byIngredientList = aliasIndexCache.get(cocktails);
  if (!byIngredientList) {
    byIngredientList = new WeakMap<Ingredient[], AliasEntry[]>();
    aliasIndexCache.set(cocktails, byIngredientList);
  }
  const cached = byIngredientList.get(ingredients);
  if (cached) return cached;
  const index = buildAliasIndex(cocktails, ingredients);
  byIngredientList.set(ingredients, index);
  return index;
}

export function findAliasConflicts(entries: AliasEntry[]): string[] {
  const entitiesByAlias = new Map<string, Set<string>>();
  entries.forEach((entry) => {
    const values = entitiesByAlias.get(entry.normalizedAlias) ?? new Set<string>();
    values.add(`${entry.entityType}:${entry.entityId}`);
    entitiesByAlias.set(entry.normalizedAlias, values);
  });
  return [...entitiesByAlias.entries()]
    .filter(([, entities]) => entities.size > 1)
    .map(([alias]) => alias);
}

function findMatches(text: string, entries: AliasEntry[], entityType: AliasEntry['entityType']): Array<AliasEntry & { start: number }> {
  const matches: Array<AliasEntry & { start: number }> = [];
  entries.filter((entry) => entry.entityType === entityType).forEach((entry) => {
    let start = text.indexOf(entry.normalizedAlias);
    while (start >= 0) {
      if (hasAliasBoundaries(text, start, entry.normalizedAlias)) {
        matches.push({ ...entry, start });
      }
      start = text.indexOf(entry.normalizedAlias, start + 1);
    }
  });
  return matches.sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length || a.start - b.start);
}

function removeRange(text: string, start: number, length: number): string {
  return `${text.slice(0, start)} ${text.slice(start + length)}`;
}

export interface RecognitionFields {
  drinkName: string;
  ingredientsText: string;
}

export function recognizeInput(
  rawInput: string,
  cocktails: Cocktail[],
  ingredients: Ingredient[]
): RecognitionResult {
  const normalized = normalizeSearchText(rawInput);
  if (!normalized) return { type: 'empty', unrecognizedTokens: [] };
  if (normalized.length > 500) return { type: 'not-found', unrecognizedTokens: [normalized] };

  const index = getAliasIndex(cocktails, ingredients);
  const cocktailMatch = findMatches(normalized, index, 'cocktail')[0];

  if (cocktailMatch) {
    const remaining = removeRange(normalized, cocktailMatch.start, cocktailMatch.normalizedAlias.length);
    const ingredientMatches = findMatches(remaining, index, 'ingredient');
    const recognizedIds = [...new Set(ingredientMatches.map((item) => item.entityId))];
    let unmatched = remaining;
    ingredientMatches
      .sort((a, b) => b.start - a.start)
      .forEach((match) => { unmatched = removeRange(unmatched, match.start, match.normalizedAlias.length); });
    const unrecognizedTokens = splitRemainingTokens(unmatched)
      .filter((token) => !/^[,，、;；/／]+$/.test(token));

    return {
      type: 'cocktail',
      cocktailId: cocktailMatch.entityId,
      matchedAlias: cocktailMatch.sourceAlias,
      recognizedExtraIngredientIds: recognizedIds,
      unrecognizedTokens
    };
  }

  const ingredientMatches = findMatches(normalized, index, 'ingredient');
  const selectedMatches: typeof ingredientMatches = [];
  const occupied: Array<[number, number]> = [];
  ingredientMatches.forEach((match) => {
    const range: [number, number] = [match.start, match.start + match.normalizedAlias.length];
    const overlaps = occupied.some(([start, end]) => range[0] < end && range[1] > start);
    if (!overlaps) {
      selectedMatches.push(match);
      occupied.push(range);
    }
  });

  if (!selectedMatches.length) return { type: 'not-found', unrecognizedTokens: splitRemainingTokens(normalized) };

  let unmatched = normalized;
  selectedMatches
    .sort((a, b) => b.start - a.start)
    .forEach((match) => { unmatched = removeRange(unmatched, match.start, match.normalizedAlias.length); });

  const ingredientById = new Map(ingredients.map((item) => [item.id, item]));
  const recognizedIngredients = [...new Set(selectedMatches.map((match) => match.entityId))]
    .map((id) => ingredientById.get(id))
    .filter((item): item is Ingredient => Boolean(item));
  const unrecognizedTokens = splitRemainingTokens(unmatched)
    .filter((token) => !/^[,，、;；/／]+$/.test(token));

  return analyzeIngredientCombination(recognizedIngredients, unrecognizedTokens);
}

export function recognizeFields(
  fields: RecognitionFields,
  cocktails: Cocktail[],
  ingredients: Ingredient[]
): RecognitionResult {
  const drinkName = fields.drinkName.trim();
  const ingredientsText = fields.ingredientsText.trim();
  const normalizedName = normalizeSearchText(drinkName);
  const normalizedIngredients = normalizeSearchText(ingredientsText);

  if (!normalizedName && !normalizedIngredients) return { type: 'empty', unrecognizedTokens: [] };
  if (normalizedName.length + normalizedIngredients.length > 500) {
    return { type: 'not-found', unrecognizedTokens: [normalizedName || normalizedIngredients] };
  }

  if (!normalizedName) return recognizeInput(ingredientsText, cocktails, ingredients);

  const index = getAliasIndex(cocktails, ingredients);
  const cocktailMatch = findMatches(normalizedName, index, 'cocktail')[0];
  if (!cocktailMatch) {
    // A bar's house cocktail name is not ingredient data. Only parse the ingredient field as a fallback.
    return normalizedIngredients
      ? recognizeInput(ingredientsText, cocktails, ingredients)
      : { type: 'not-found', unrecognizedTokens: splitRemainingTokens(normalizedName) };
  }

  const extras = normalizedIngredients
    ? recognizeInput(ingredientsText, cocktails, ingredients)
    : null;
  return {
    type: 'cocktail',
    cocktailId: cocktailMatch.entityId,
    matchedAlias: cocktailMatch.sourceAlias,
    recognizedExtraIngredientIds: extras?.type === 'ingredient-combination' ? extras.recognizedIngredientIds : [],
    unrecognizedTokens: extras?.type === 'ingredient-combination' ? extras.unrecognizedTokens : []
  };
}
