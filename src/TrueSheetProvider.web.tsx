import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import type { TrueSheetContextMethods } from './TrueSheet.types';
import type { TrueSheet } from './TrueSheet';

export type TrueSheetRef = Pick<TrueSheet, 'present' | 'dismiss' | 'resize' | 'dismissStack'>;

interface BottomSheetContextValue extends TrueSheetContextMethods {
  register: (name: string, methods: RefObject<TrueSheetRef>) => void;
  unregister: (name: string) => void;
  pushToStack: (name: string) => void;
  removeFromStack: (name: string) => void;
  getSheetsAbove: (name: string) => string[];
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
  const presentedStackRef = useRef<string[]>([]);

  const register = (name: string, methods: RefObject<TrueSheetRef>) => {
    sheetsRef.current.set(name, methods);
  };

  const unregister = (name: string) => {
    sheetsRef.current.delete(name);
  };

  const pushToStack = (name: string) => {
    const index = presentedStackRef.current.indexOf(name);
    if (index >= 0) {
      presentedStackRef.current.splice(index, 1);
    }
    presentedStackRef.current.push(name);
  };

  const removeFromStack = (name: string) => {
    const index = presentedStackRef.current.indexOf(name);
    if (index >= 0) {
      presentedStackRef.current.splice(index, 1);
    }
  };

  /**
   * Returns all sheets presented on top of the given sheet.
   * Returns them in reverse order (top-most first) for proper dismissal.
   */
  const getSheetsAbove = (name: string): string[] => {
    const index = presentedStackRef.current.indexOf(name);
    if (index < 0 || index >= presentedStackRef.current.length - 1) return [];
    return presentedStackRef.current.slice(index + 1).reverse();
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

  const dismissStack = async (name: string) => {
    const sheet = sheetsRef.current.get(name);
    if (!sheet?.current) {
      console.warn(`TrueSheet: Could not find sheet with name "${name}"`);
      return;
    }
    return sheet.current.dismissStack();
  };

  const resize = async (name: string, index: number) => {
    const sheet = sheetsRef.current.get(name);
    if (!sheet?.current) {
      console.warn(`TrueSheet: Could not find sheet with name "${name}"`);
      return;
    }
    return sheet.current.resize(index);
  };

  const dismissAll = async () => {
    const rootSheet = presentedStackRef.current[0];
    if (!rootSheet) return;
    return dismiss(rootSheet);
  };

  return (
    <BottomSheetContext.Provider
      value={{
        register,
        unregister,
        pushToStack,
        removeFromStack,
        getSheetsAbove,
        present,
        dismiss,
        dismissStack,
        resize,
        dismissAll,
      }}
    >
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
    dismissStack: context.dismissStack,
    resize: context.resize,
    dismissAll: context.dismissAll,
  };
}
