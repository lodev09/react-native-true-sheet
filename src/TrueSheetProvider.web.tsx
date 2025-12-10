import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import type { TrueSheetContextMethods, TrueSheetRef } from './TrueSheet.types';

interface BottomSheetContextValue extends TrueSheetContextMethods {
  register: (name: string, methods: RefObject<TrueSheetRef>) => void;
  unregister: (name: string) => void;
}

export const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export interface TrueSheetProviderProps {
  children: ReactNode;
}

/**
 * Provider for TrueSheet on web.
 * Required to wrap your app for sheet management via useTrueSheet hook.
 */
export function TrueSheetProvider({ children }: TrueSheetProviderProps) {
  const sheetsRef = useRef<Map<string, RefObject<TrueSheetRef>>>(new Map());

  const register = (name: string, methods: RefObject<TrueSheetRef>) => {
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
    <BottomSheetContext.Provider value={{ register, unregister, present, dismiss, resize }}>
      <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
    </BottomSheetContext.Provider>
  );
}

/**
 * Hook to control TrueSheet instances by name.
 * On web, this uses the TrueSheetContext from TrueSheetProvider.
 */
export function useTrueSheet(): TrueSheetContextMethods {
  const context = useContext(BottomSheetContext);

  if (!context) {
    throw new Error('useTrueSheet must be used within a TrueSheetProvider');
  }

  return {
    present: context.present,
    dismiss: context.dismiss,
    resize: context.resize,
  };
}
