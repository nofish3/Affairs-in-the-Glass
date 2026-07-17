export const TASTE_KEYS = ['sour', 'sweet', 'bitter', 'salty', 'umami', 'spicy'] as const;
export type TasteKey = (typeof TASTE_KEYS)[number];
export type TasteLevel = 0 | 1 | 2 | 3;
export type SelectedTasteLevel = Exclude<TasteLevel, 0>;

export const AROMAS = ['floral', 'fruity', 'herbal', 'woody', 'spiced', 'creamy'] as const;
export type Aroma = (typeof AROMAS)[number];

export const ALCOHOL_FEELINGS = ['soft', 'medium', 'strong'] as const;
export type AlcoholFeeling = (typeof ALCOHOL_FEELINGS)[number];

export const TEXTURES = ['refreshing', 'smooth', 'rich'] as const;
export type Texture = (typeof TEXTURES)[number];

export type OptionalChoice<T> = T | 'random';

export type IngredientCategory =
  | 'base-spirit'
  | 'liqueur'
  | 'wine'
  | 'bitter'
  | 'juice'
  | 'syrup'
  | 'mixer'
  | 'dairy'
  | 'herb-spice'
  | 'other';

export interface Ingredient {
  id: string;
  name: string;
  englishName?: string;
  aliases: string[];
  category: IngredientCategory;
  tasteContribution: Partial<Record<TasteKey, TasteLevel>>;
  aromas: Aroma[];
  alcoholStrength: TasteLevel;
  textureContributions: Texture[];
  roleDescription: string;
  standaloneSummary: string;
  enabled: boolean;
}

export interface Cocktail {
  id: string;
  name: string;
  englishName: string;
  aliases: string[];
  ingredientIds: string[];
  taste: Record<TasteKey, TasteLevel>;
  primaryAroma: Aroma;
  aromas: Aroma[];
  alcoholFeeling: AlcoholFeeling;
  texture: Texture;
  tags: string[];
  summary: string;
  feeling: string;
  popularity: number;
  enabled: boolean;
}

export interface Preference {
  tastes: Partial<Record<TasteKey, SelectedTasteLevel>>;
  aroma: OptionalChoice<Aroma> | null;
  alcoholFeeling: OptionalChoice<AlcoholFeeling> | null;
  texture: OptionalChoice<Texture> | null;
}

export interface RecommendationReason {
  dimension: 'taste' | 'aroma' | 'alcohol' | 'texture';
  text: string;
  match: 'exact' | 'near' | 'relaxed';
}

export interface RecommendationResult {
  cocktailId: string;
  score: number;
  matchType: 'strict' | 'relaxed';
  reasons: RecommendationReason[];
}

export interface RecommendationSession {
  preference: Preference;
  shownCocktailIds: string[];
  changeCount: number;
  current?: RecommendationResult;
}

export interface CocktailRecognitionResult {
  type: 'cocktail';
  cocktailId: string;
  matchedAlias: string;
  recognizedExtraIngredientIds: string[];
  unrecognizedTokens: string[];
}

export interface IngredientRecognitionResult {
  type: 'ingredient-combination';
  recognizedIngredientIds: string[];
  unrecognizedTokens: string[];
  estimatedTaste: Record<TasteKey, TasteLevel>;
  aromas: Aroma[];
  alcoholFeeling: AlcoholFeeling | null;
  texture: Texture | null;
  summary: string;
  feeling: string;
}

export interface EmptyRecognitionResult {
  type: 'empty' | 'not-found';
  unrecognizedTokens: string[];
}

export type RecognitionResult =
  | CocktailRecognitionResult
  | IngredientRecognitionResult
  | EmptyRecognitionResult;

export interface DrinkRecord {
  id: string;
  drinkName: string;
  ingredientsText: string;
  feeling: string;
  createdAt: number;
  updatedAt: number;
}

export type RecordInput = Pick<DrinkRecord, 'drinkName' | 'ingredientsText' | 'feeling'>;

