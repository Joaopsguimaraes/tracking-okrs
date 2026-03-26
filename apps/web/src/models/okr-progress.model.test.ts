import { describe, expect, it } from 'vitest';

import { calculateProgressPercentage } from '@/models/okr-progress.model';

describe('calculateProgressPercentage', () => {
  it('returns zero when the target is zero or negative', () => {
    expect(calculateProgressPercentage({ currentValue: 10, targetValue: 0 })).toBe(0);
  });

  it('clamps percentage between zero and one hundred', () => {
    expect(calculateProgressPercentage({ currentValue: 50, targetValue: 100 })).toBe(50);
    expect(calculateProgressPercentage({ currentValue: 180, targetValue: 100 })).toBe(100);
    expect(calculateProgressPercentage({ currentValue: -10, targetValue: 100 })).toBe(0);
  });
});
