import type { RecognitionResult } from '../types/domain';

export interface RecognitionInputFields {
  drinkName: string;
  ingredientsText: string;
}

interface RecognitionSession {
  fields: RecognitionInputFields;
  input: string;
  result: RecognitionResult;
}

let session: RecognitionSession | null = null;

export function setRecognitionSession(fields: RecognitionInputFields, input: string, result: RecognitionResult): void {
  session = { fields: { ...fields }, input, result };
}

export function getRecognitionSession(): RecognitionSession | null {
  return session ? { ...session, fields: { ...session.fields } } : null;
}
