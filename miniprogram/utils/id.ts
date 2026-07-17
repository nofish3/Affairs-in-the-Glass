let sequence = 0;

export function createId(now: number = Date.now(), random: () => number = Math.random): string {
  sequence = (sequence + 1) % 1_000_000;
  const entropy = Math.floor(random() * 0xfffffff).toString(36).padStart(5, '0');
  return `${now.toString(36)}-${sequence.toString(36)}-${entropy}`;
}

