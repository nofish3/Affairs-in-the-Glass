import type { DrinkRecord, RecordInput } from '../types/domain';
import { createId } from '../utils/id';
import { normalizeRecordInput, validateRecordInput } from '../utils/validation';

export const RECORDS_STORAGE_KEY = 'beizhongshi.records.v1';

export interface StorageAdapter {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

function isDrinkRecord(value: unknown): value is DrinkRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string'
    && typeof item.drinkName === 'string'
    && typeof item.ingredientsText === 'string'
    && typeof item.feeling === 'string'
    && typeof item.createdAt === 'number'
    && typeof item.updatedAt === 'number';
}

export class RecordRepository {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly now: () => number = Date.now,
    private readonly random: () => number = Math.random
  ) {}

  list(): DrinkRecord[] {
    const raw = this.storage.get(RECORDS_STORAGE_KEY);
    if (raw === undefined || raw === null || raw === '') return [];
    if (!Array.isArray(raw)) throw new Error('本地记录读取失败');
    return raw.filter(isDrinkRecord).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): DrinkRecord | null {
    return this.list().find((record) => record.id === id) ?? null;
  }

  create(input: RecordInput): DrinkRecord {
    const normalized = normalizeRecordInput(input);
    const validation = validateRecordInput(normalized);
    if (!validation.valid) throw new Error(validation.errors[0]);
    const timestamp = this.now();
    const record: DrinkRecord = {
      id: createId(timestamp, this.random),
      ...normalized,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const records = this.list();
    this.storage.set(RECORDS_STORAGE_KEY, [record, ...records]);
    return record;
  }

  update(id: string, input: RecordInput): DrinkRecord {
    const normalized = normalizeRecordInput(input);
    const validation = validateRecordInput(normalized);
    if (!validation.valid) throw new Error(validation.errors[0]);
    const records = this.list();
    const existing = records.find((record) => record.id === id);
    if (!existing) throw new Error('没有找到这条记录');
    const updated: DrinkRecord = { ...existing, ...normalized, updatedAt: this.now() };
    this.storage.set(RECORDS_STORAGE_KEY, records.map((record) => record.id === id ? updated : record));
    return updated;
  }

  remove(id: string): void {
    const records = this.list();
    this.storage.set(RECORDS_STORAGE_KEY, records.filter((record) => record.id !== id));
  }
}

export function createWechatStorageAdapter(): StorageAdapter {
  return {
    get: (key) => wx.getStorageSync(key),
    set: (key, value) => wx.setStorageSync(key, value)
  };
}

