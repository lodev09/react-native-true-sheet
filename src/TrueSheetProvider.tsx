import type { ReactNode } from 'react';

import { TrueSheet } from './TrueSheet';
import type { AccessibilityOptions, TrueSheetStaticMethods } from './TrueSheet.types';
import {
  AccessibilityOptionsContext,
  useProvidedAccessibilityOptions,
} from './accessibilityOptions';

export type { TrueSheetStaticMethods };

export interface TrueSheetProviderProps {
  children: ReactNode;
  /**
   * Default `accessibilityOptions` for every sheet under this provider.
   */
  accessibilityOptions?: AccessibilityOptions;
}

/**
 * Provider for TrueSheet on native platforms.
 * Optional on native since TrueSheet uses static instance methods internally.
 */
export function TrueSheetProvider({ children, accessibilityOptions }: TrueSheetProviderProps) {
  const resolvedAccessibilityOptions = useProvidedAccessibilityOptions(accessibilityOptions);

  return (
    <AccessibilityOptionsContext.Provider value={resolvedAccessibilityOptions}>
      {children}
    </AccessibilityOptionsContext.Provider>
  );
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
