import { createElement, isValidElement } from 'react';
import type { TrueSheetProps } from '../TrueSheet.types';

export const getElevationShadow = (elevation: number): string => {
  if (elevation <= 0) return 'none';
  const ambientY = elevation * 0.5;
  const ambientBlur = elevation * 1.5;
  const ambientOpacity = 0.08 + elevation * 0.01;
  const keyY = elevation;
  const keyBlur = elevation * 2;
  const keyOpacity = 0.12 + elevation * 0.02;
  return `0px ${ambientY}px ${ambientBlur}px rgba(0, 0, 0, ${ambientOpacity}), 0px ${keyY}px ${keyBlur}px rgba(0, 0, 0, ${keyOpacity})`;
};

export const renderSlot = (slot: TrueSheetProps['header'] | TrueSheetProps['footer']) => {
  if (!slot) return null;
  if (isValidElement(slot)) return slot;
  return createElement(slot);
};
