import { clamp } from 'lodash-es';

export type KeyResultProgressInput = {
  currentValue: number;
  targetValue: number;
};

export const calculateProgressPercentage = ({
  currentValue,
  targetValue,
}: KeyResultProgressInput): number => {
  if (targetValue <= 0) {
    return 0;
  }

  return clamp(Math.round((currentValue / targetValue) * 100), 0, 100);
};
