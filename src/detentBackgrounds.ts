import type { DetentBackground } from './TrueSheet.types';

export function normalizeDetentBackground(entry: DetentBackground | null | undefined) {
  return typeof entry === 'string' ? { color: entry } : entry;
}

export function getDetentBackgroundIndex(
  height: number,
  detentHeights: readonly number[],
  displayedIndex: number
): number {
  if (detentHeights.length === 0) return -1;

  let nextIndex = Math.max(0, Math.min(displayedIndex, detentHeights.length - 1));
  let distance = Math.abs(height - detentHeights[nextIndex]!);
  for (let index = 0; index < detentHeights.length; index++) {
    const nextDistance = Math.abs(height - detentHeights[index]!);
    if (nextDistance < distance) {
      nextIndex = index;
      distance = nextDistance;
    }
  }
  return nextIndex;
}
