import { describe, expect, it } from 'vitest';
import { RECORDS_STORAGE_KEY, RecordRepository } from '../../miniprogram/storage/record-repository';
import { MemoryStorage } from '../helpers/memory-storage';

describe('record repository', () => {
  it('creates name-only and ingredients-only records and trims input', () => {
    const storage = new MemoryStorage();
    const repository = new RecordRepository(storage, () => 100, () => 0.1);
    const named = repository.create({ drinkName: '  金汤力  ', ingredientsText: '', feeling: '' });
    const ingredients = repository.create({ drinkName: '', ingredientsText: '  金酒、青柠 ', feeling: '  清爽 ' });
    expect(named.drinkName).toBe('金汤力');
    expect(ingredients.ingredientsText).toBe('金酒、青柠');
    expect(ingredients.feeling).toBe('清爽');
    expect(named.id).not.toBe(ingredients.id);
  });

  it('rejects feeling-only records', () => {
    const repository = new RecordRepository(new MemoryStorage());
    expect(() => repository.create({ drinkName: '', ingredientsText: '', feeling: '好喝' })).toThrow('酒名或配料至少填写一项');
  });

  it('updates without changing createdAt and sorts by updatedAt', () => {
    let now = 100;
    const repository = new RecordRepository(new MemoryStorage(), () => now, () => 0.2);
    const first = repository.create({ drinkName: '第一杯', ingredientsText: '', feeling: '' });
    now = 200;
    const second = repository.create({ drinkName: '第二杯', ingredientsText: '', feeling: '' });
    now = 300;
    const updated = repository.update(first.id, { drinkName: '第一杯修改', ingredientsText: '', feeling: '' });
    expect(updated.createdAt).toBe(100);
    expect(updated.updatedAt).toBe(300);
    expect(repository.list().map((item) => item.id)).toEqual([first.id, second.id]);
  });

  it('removes records', () => {
    const repository = new RecordRepository(new MemoryStorage(), () => 100, () => 0.3);
    const record = repository.create({ drinkName: '一杯', ingredientsText: '', feeling: '' });
    repository.remove(record.id);
    expect(repository.list()).toEqual([]);
  });

  it('skips damaged items but rejects a damaged root value without overwriting it', () => {
    const storage = new MemoryStorage();
    storage.seed(RECORDS_STORAGE_KEY, [{ nope: true }, { id: 'ok', drinkName: '酒', ingredientsText: '', feeling: '', createdAt: 1, updatedAt: 1 }]);
    const repository = new RecordRepository(storage);
    expect(repository.list()).toHaveLength(1);
    storage.seed(RECORDS_STORAGE_KEY, { bad: true });
    expect(() => repository.list()).toThrow('本地记录读取失败');
    expect(storage.get(RECORDS_STORAGE_KEY)).toEqual({ bad: true });
  });

  it('preserves the caller state when storage writes fail', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const repository = new RecordRepository(storage);
    expect(() => repository.create({ drinkName: '金汤力', ingredientsText: '', feeling: '' })).toThrow('storage failed');
    expect(storage.get(RECORDS_STORAGE_KEY)).toBeUndefined();
  });
});

