import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { COCKTAILS } from '../../miniprogram/data/cocktails';
import { INGREDIENTS } from '../../miniprogram/data/ingredients';
import { recognizeInput } from '../../miniprogram/services/recognition-service';
import { recommend } from '../../miniprogram/services/recommendation-service';
import { RECORDS_STORAGE_KEY, RecordRepository } from '../../miniprogram/storage/record-repository';
import type { DrinkRecord, Preference } from '../../miniprogram/types/domain';
import { MemoryStorage } from '../helpers/memory-storage';

const preference: Preference = {
  tastes: { sour: 2, sweet: 1 },
  aroma: 'fruity',
  alcoholFeeling: 'medium',
  texture: 'refreshing'
};

describe('MVP performance targets', () => {
  it('calculates a recommendation within 50 ms', () => {
    const startedAt = performance.now();
    const result = recommend(preference, COCKTAILS, new Set(), () => 0.5);
    const duration = performance.now() - startedAt;
    expect(result).not.toBeNull();
    expect(duration).toBeLessThan(50);
  });

  it('recognizes a maximum-length input within 100 ms', () => {
    const input = `${'未知配料，'.repeat(60)}威士忌`.slice(0, 500);
    const startedAt = performance.now();
    const result = recognizeInput(input, COCKTAILS, INGREDIENTS);
    const duration = performance.now() - startedAt;
    expect(result.type).toBe('ingredient-combination');
    expect(duration).toBeLessThan(100);
  });

  it('reads and sorts 500 local records within 100 ms', () => {
    const storage = new MemoryStorage();
    const records: DrinkRecord[] = Array.from({ length: 500 }, (_, index) => ({
      id: `record-${index}`,
      drinkName: `第 ${index + 1} 杯`,
      ingredientsText: '',
      feeling: '',
      createdAt: index,
      updatedAt: index
    }));
    storage.seed(RECORDS_STORAGE_KEY, records);
    const repository = new RecordRepository(storage);
    const startedAt = performance.now();
    const result = repository.list();
    const duration = performance.now() - startedAt;
    expect(result).toHaveLength(500);
    expect(result[0]?.updatedAt).toBe(499);
    expect(duration).toBeLessThan(100);
  });
});
