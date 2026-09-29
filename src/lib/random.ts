export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function randomArray(size: number, min: number, max: number): number[] {
  return Array.from({ length: size }, () => randomInt(min, max));
}

export function randomUniqueSortedArray(size: number, min: number, max: number): number[] {
  const values = new Set<number>();
  while (values.size < Math.min(size, max - min + 1)) values.add(randomInt(min, max));
  return [...values].sort((a, b) => a - b);
}
