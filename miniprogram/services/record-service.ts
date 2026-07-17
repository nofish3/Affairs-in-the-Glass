import { RecordRepository, createWechatStorageAdapter } from '../storage/record-repository';

let repository: RecordRepository | null = null;

export function getRecordRepository(): RecordRepository {
  if (!repository) repository = new RecordRepository(createWechatStorageAdapter());
  return repository;
}

