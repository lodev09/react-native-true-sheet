import { createContext, type ReactNode, type RefObject } from 'react';

import type { TrueSheetMethods, TrueSheetStaticMethods } from './TrueSheet.types';

type SheetRef = RefObject<TrueSheetMethods | null>;

interface SheetContextValue {
  // TODO: define shape
}

export const SheetContext = createContext<SheetContextValue | null>(null);

export interface TrueSheetProviderProps {
  children: ReactNode;
}

export function TrueSheetProvider({ children }: TrueSheetProviderProps) {
  // TODO: implement
  return <>{children}</>;
}

export function useTrueSheet(): TrueSheetStaticMethods {
  // TODO: implement
  const noop = async () => {};
  return {
    present: noop,
    dismiss: noop,
    dismissStack: noop,
    resize: noop,
    dismissAll: noop,
  };
}

export function useRegisterSheet(_name: string | undefined, _ref: SheetRef): void {
  // TODO: implement
}
