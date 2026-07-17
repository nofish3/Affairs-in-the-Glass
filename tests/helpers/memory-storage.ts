import type { StorageAdapter } from '../../miniprogram/storage/record-repository';

export class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, unknown>();
  failWrites = false;

  get(key: string): unknown {
    return this.values.get(key);
  }

  set(key: string, value: unknown): void {
    if (this.failWrites) throw new Error('storage failed');
    this.values.set(key, value);
  }

  seed(key: string, value: unknown): void {
    this.values.set(key, value);
  }
}

