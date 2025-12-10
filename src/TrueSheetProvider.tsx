import type { ReactNode } from 'react';

import { TrueSheet } from './TrueSheet';
import type { TrueSheetContextMethods } from './TrueSheet.types';

export interface TrueSheetProviderProps {
  children: ReactNode;
}

/**
 * Provider for TrueSheet on native platforms.
 * This is a pass-through component - no context is needed on native
 * since TrueSheet uses static instance methods internally.
 */
export function TrueSheetProvider({ children }: TrueSheetProviderProps) {
  return children;
}

/**
 * Hook to control TrueSheet instances by name.
 * On native, this maps directly to TrueSheet static methods.
 */
export function useTrueSheet(): TrueSheetContextMethods {
  return {
    present: TrueSheet.present,
    dismiss: TrueSheet.dismiss,
    resize: TrueSheet.resize,
  };
}
