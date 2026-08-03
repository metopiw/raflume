import path from 'node:path';

export function buildCollisionName(fileName: string, index: number): string {
  const parsed = path.parse(fileName);
  return `${parsed.name} (${index})${parsed.ext}`;
}

export function normalizeComparablePath(filePath: string): string {
  const normalized = path.resolve(filePath);
  return process.platform === 'win32' ? normalized.toLocaleLowerCase('en-US') : normalized;
}

export function pathsEqual(left: string, right: string): boolean {
  return normalizeComparablePath(left) === normalizeComparablePath(right);
}
