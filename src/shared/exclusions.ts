import path from 'node:path';
import type { ExclusionItem, ExclusionKind } from './types';

export function normalizeExclusionPath(filePath: string): string {
  const normalized = filePath.replace(/[\\/]+/g, path.sep).replace(/[\\/]+$/, '');
  return process.platform === 'win32' ? normalized.toLocaleLowerCase('en-US') : normalized;
}

export function isPathExcluded(itemPath: string, exclusions: readonly ExclusionItem[]): boolean {
  const candidate = normalizeExclusionPath(itemPath);
  for (const exclusion of exclusions) {
    const excludedPath = normalizeExclusionPath(exclusion.path);
    if (candidate === excludedPath) return true;
    if (exclusion.kind === 'directory' && candidate.startsWith(`${excludedPath}${path.sep}`)) return true;
  }
  return false;
}

export function isWatchedRootExcluded(candidatePath: string, watchedRoots: readonly string[]): boolean {
  const candidate = normalizeExclusionPath(candidatePath);
  return watchedRoots.some((root) => normalizeExclusionPath(root) === candidate);
}

export function normalizeExclusions(value: unknown): ExclusionItem[] {
  if (!Array.isArray(value)) return [];
  const items: ExclusionItem[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;
    const candidate = entry as { path?: unknown; name?: unknown; kind?: unknown };
    if (typeof candidate.path !== 'string' || candidate.path.trim().length === 0) continue;
    const kind: ExclusionKind = candidate.kind === 'directory' ? 'directory' : 'file';
    const name = typeof candidate.name === 'string' && candidate.name.trim().length > 0
      ? candidate.name
      : path.basename(candidate.path);
    items.push({ path: candidate.path, name, kind });
  }
  return items;
}

export function buildExclusionAdditions(
  candidates: readonly string[],
  existing: readonly ExclusionItem[],
  watchedRoots: readonly string[],
  kind: ExclusionKind,
): ExclusionItem[] {
  const seen = new Set(existing.map((item) => normalizeExclusionPath(item.path)));
  const added: ExclusionItem[] = [];
  for (const candidate of candidates) {
    const normalized = normalizeExclusionPath(candidate);
    if (normalized.length === 0) continue;
    if (seen.has(normalized)) continue;
    if (isWatchedRootExcluded(candidate, watchedRoots)) continue;
    seen.add(normalized);
    added.push({ path: candidate, name: path.basename(candidate), kind });
  }
  return added;
}
