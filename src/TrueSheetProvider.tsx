import type { ReactNode } from 'react';

import { TrueSheet } from './TrueSheet';

export type TrueSheetStaticMethods = Pick<
  typeof TrueSheet,
  'present' | 'dismiss' | 'dismissStack' | 'resize' | 'dismissAll'
>;

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
export function useTrueSheet(): TrueSheetStaticMethods {
  return {
    present: TrueSheet.present,
    dismiss: TrueSheet.dismiss,
    dismissStack: TrueSheet.dismissStack,
    resize: TrueSheet.resize,
    dismissAll: TrueSheet.dismissAll,
  };
}
