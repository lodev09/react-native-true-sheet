import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';

import type { TrueSheetMethods } from './TrueSheet.types';

/**
 * Internal methods for a single sheet instance (used by context registration).
 */
export interface TrueSheetInstanceMethods {
  present: (index?: number) => Promise<void>;
  dismiss: () => Promise<void>;
  resize: (index: number) => Promise<void>;
}

interface TrueSheetContextValue {
  register: (name: string, methods: RefObject<TrueSheetInstanceMethods>) => void;
  unregister: (name: string) => void;
  present: (name: string, index?: number) => Promise<void>;
  dismiss: (name: string) => Promise<void>;
  resize: (name: string, index: number) => Promise<void>;
}

export const TrueSheetContext = createContext<TrueSheetContextValue | null>(null);

export interface TrueSheetProviderProps {
  children: ReactNode;
}

/**
 * Provider for TrueSheet on web.
 * Required to wrap your app for sheet management via useTrueSheet hook.
 */
export function TrueSheetProvider({ children }: TrueSheetProviderProps) {
  const sheetsRef = useRef<Map<string, RefObject<TrueSheetInstanceMethods>>>(new Map());

  const register = (name: string, methods: RefObject<TrueSheetInstanceMethods>) => {
    sheetsRef.current.set(name, methods);
  };

  const unregister = (name: string) => {
    sheetsRef.current.delete(name);
  };

  const present = async (name: string, index: number = 0) => {
    const sheet = sheetsRef.current.get(name);
    if (!sheet?.current) {
      console.warn(`TrueSheet: Could not find sheet with name "${name}"`);
      return;
    }
    return sheet.current.present(index);
  };

  const dismiss = async (name: string) => {
    const sheet = sheetsRef.current.get(name);
    if (!sheet?.current) {
      console.warn(`TrueSheet: Could not find sheet with name "${name}"`);
      return;
    }
    return sheet.current.dismiss();
  };

  const resize = async (name: string, index: number) => {
    const sheet = sheetsRef.current.get(name);
    if (!sheet?.current) {
      console.warn(`TrueSheet: Could not find sheet with name "${name}"`);
      return;
    }
    return sheet.current.resize(index);
  };

  return (
    <TrueSheetContext.Provider value={{ register, unregister, present, dismiss, resize }}>
      {children}
    </TrueSheetContext.Provider>
  );
}

/**
 * Hook to control TrueSheet instances by name.
 * On web, this uses the TrueSheetContext from TrueSheetProvider.
 */
export function useTrueSheet(): TrueSheetMethods {
  const context = useContext(TrueSheetContext);

  if (!context) {
    throw new Error('useTrueSheet must be used within a TrueSheetProvider');
  }

  return {
    present: context.present,
    dismiss: context.dismiss,
    resize: context.resize,
  };
}
