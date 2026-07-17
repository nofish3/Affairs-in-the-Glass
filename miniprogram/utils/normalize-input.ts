const FULL_WIDTH_OFFSET = 0xfee0;

export function toHalfWidth(value: string): string {
  return value.replace(/[！-～]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - FULL_WIDTH_OFFSET)
  ).replace(/　/g, ' ');
}

export function normalizeSearchText(value: string): string {
  return toHalfWidth(value)
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/\s+/g, ' ')
    .trim();
}

export const TOKEN_SEPARATOR = /[，,、；;\/／\t\r\n]+|\s{2,}/g;

export function splitRemainingTokens(value: string): string[] {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];

  return normalized
    .split(TOKEN_SEPARATOR)
    .flatMap((token) => token.includes(' ') && !/[a-z]/i.test(token) ? token.split(' ') : [token])
    .map((token) => token.trim())
    .filter(Boolean);
}

