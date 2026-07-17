import { describe, expect, it } from 'vitest';
import { validatePreference, validateRecordInput } from '../../miniprogram/utils/validation';

describe('validation', () => {
  it('requires one taste and every single choice group', () => {
    expect(validatePreference({ tastes: {}, aroma: null, alcoholFeeling: null, texture: null }).errors).toEqual([
      '请至少选择一种味道', '请选择香气', '请选择酒感', '请选择口感'
    ]);
  });

  it('accepts random as an active choice', () => {
    expect(validatePreference({ tastes: { sour: 2 }, aroma: 'random', alcoholFeeling: 'random', texture: 'random' }).valid).toBe(true);
  });

  it('requires drink name or ingredients and permits an empty feeling', () => {
    expect(validateRecordInput({ drinkName: '', ingredientsText: '', feeling: '很好' }).valid).toBe(false);
    expect(validateRecordInput({ drinkName: '金汤力', ingredientsText: '', feeling: '' }).valid).toBe(true);
    expect(validateRecordInput({ drinkName: '', ingredientsText: '金酒、青柠', feeling: '' }).valid).toBe(true);
  });
});

