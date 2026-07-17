import type { RecognitionResult } from '../types/domain';

interface RecognitionSession {
  input: string;
  result: RecognitionResult;
}

let session: RecognitionSession | null = null;

export function setRecognitionSession(input: string, result: RecognitionResult): void {
  session = { input, result };
}

export function getRecognitionSession(): RecognitionSession | null {
  return session ? { ...session } : null;
}

