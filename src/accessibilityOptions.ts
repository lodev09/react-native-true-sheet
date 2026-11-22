import { createContext, useContext, useMemo } from 'react';

import type { AccessibilityOptions } from './TrueSheet.types';

export const AccessibilityOptionsContext = createContext<AccessibilityOptions | undefined>(
  undefined
);

export const mergeAccessibilityOptions = (
  defaults: AccessibilityOptions | undefined,
  options: AccessibilityOptions | undefined
): AccessibilityOptions | undefined => {
  if (!defaults) return options;
  if (!options) return defaults;
  return { ...defaults, ...options };
};

export const useProvidedAccessibilityOptions = (
  options: AccessibilityOptions | undefined
): AccessibilityOptions | undefined => {
  const parent = useContext(AccessibilityOptionsContext);
  return useMemo(() => mergeAccessibilityOptions(parent, options), [parent, options]);
};
