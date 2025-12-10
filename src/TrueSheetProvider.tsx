import type { ReactNode } from 'react';

import { TrueSheet } from './TrueSheet';
import type { TrueSheetMethods } from './TrueSheet.types';

export interface TrueSheetProviderProps {
  children: ReactNode;
}

/**
 * Provider for TrueSheet on native platforms.
 * This is a pass-through component - no context is needed on native
 * since TrueSheet uses static instance methods internally.
 */
export function TrueSheetProvider({ children }: TrueSheetProviderProps) {
  return <>{children}</>;
}

/**
 * Hook to control TrueSheet instances by name.
 * On native, this maps directly to TrueSheet static methods.
 */
export function useTrueSheet(): TrueSheetMethods {
  return {
    present: (name: string, index: number = 0) => TrueSheet.present(name, index),
    dismiss: (name: string) => TrueSheet.dismiss(name),
    resize: (name: string, index: number) => TrueSheet.resize(name, index),
  };
}
