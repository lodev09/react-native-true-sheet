import { getDetentBackgroundIndex } from '../detentBackgrounds';

describe('detent background midpoint transitions', () => {
  const heights = [100, 400, 1000];

  it.each([
    [249, 0, 0],
    [250, 0, 0],
    [251, 0, 1],
    [251, 1, 1],
    [250, 1, 1],
    [249, 1, 0],
    [699, 1, 1],
    [700, 1, 1],
    [701, 1, 2],
    [701, 2, 2],
    [700, 2, 2],
    [699, 2, 1],
  ])('at height %s from entry %s displays %s', (height, current, expected) => {
    expect(getDetentBackgroundIndex(height, heights, current)).toBe(expected);
  });

  it('crosses both segments during a resize and reverses mid-transition', () => {
    let current = 0;
    const indices = [200, 300, 800, 600, 200].map((height) => {
      current = getDetentBackgroundIndex(height, heights, current);
      return current;
    });
    expect(indices).toEqual([0, 1, 2, 1, 0]);
  });

  it('clamps overshoot at either end', () => {
    expect(getDetentBackgroundIndex(-20, heights, 2)).toBe(0);
    expect(getDetentBackgroundIndex(1200, heights, 0)).toBe(2);
  });

  it('uses measured heights after auto/peek content changes', () => {
    expect(getDetentBackgroundIndex(300, [100, 400, 1000], 0)).toBe(1);
    expect(getDetentBackgroundIndex(300, [100, 700, 1000], 0)).toBe(0);
  });

  it('retains the current entry when detents resolve to the same height', () => {
    expect(getDetentBackgroundIndex(400, [400, 400], 1)).toBe(1);
    expect(getDetentBackgroundIndex(400, [400, 400], 0)).toBe(0);
  });

  it('handles removed detents, a single detent, and an empty list', () => {
    expect(getDetentBackgroundIndex(400, [100, 400], 2)).toBe(1);
    expect(getDetentBackgroundIndex(400, [100], -1)).toBe(0);
    expect(getDetentBackgroundIndex(400, [], 0)).toBe(-1);
  });
});
