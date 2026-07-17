import type { Preference, RecordInput, TasteKey } from '../types/domain';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePreference(preference: Preference): ValidationResult {
  const errors: string[] = [];
  const selectedTastes = Object.keys(preference.tastes) as TasteKey[];

  if (selectedTastes.length === 0) errors.push('请至少选择一种味道');
  if (preference.aroma === null) errors.push('请选择香气');
  if (preference.alcoholFeeling === null) errors.push('请选择酒感');
  if (preference.texture === null) errors.push('请选择口感');

  return { valid: errors.length === 0, errors };
}

export function normalizeRecordInput(input: RecordInput): RecordInput {
  return {
    drinkName: input.drinkName.trim(),
    ingredientsText: input.ingredientsText.trim(),
    feeling: input.feeling.trim()
  };
}

export function validateRecordInput(input: RecordInput): ValidationResult {
  const normalized = normalizeRecordInput(input);
  const errors: string[] = [];

  if (!normalized.drinkName && !normalized.ingredientsText) {
    errors.push('酒名或配料至少填写一项');
  }
  if (normalized.drinkName.length > 80) errors.push('酒名不能超过 80 个字符');
  if (normalized.ingredientsText.length > 500) errors.push('配料不能超过 500 个字符');
  if (normalized.feeling.length > 2000) errors.push('感受不能超过 2000 个字符');

  return { valid: errors.length === 0, errors };
}

