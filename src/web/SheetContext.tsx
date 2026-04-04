import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';

import { getWebRenderer } from './registry';
import type { TrueSheetRefMethods } from './types';
import type { TrueSheetStaticMethods } from '../TrueSheetProvider';

interface SheetContextValue extends TrueSheetStaticMethods {
  register: (name: string, methods: RefObject<TrueSheetRefMethods>) => void;
  unregister: (name: string) => void;
  pushToStack: (name: string) => void;
  removeFromStack: (name: string) => void;
  getSheetsAbove: (name: string) => string[];
}

export const SheetContext = createContext<SheetContextValue | null>(null);

export interface TrueSheetProviderProps {
  children: ReactNode;
}

export function TrueSheetProvider({ children }: TrueSheetProviderProps) {
  const sheetsRef = useRef<Map<string, RefObject<TrueSheetRefMethods>>>(new Map());
  const presentedStackRef = useRef<string[]>([]);

  const register = (name: string, methods: RefObject<TrueSheetRefMethods>) => {
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

  const renderer = getWebRenderer();
  const RendererProvider = renderer.Provider;

  const content = (
    <SheetContext.Provider
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
      {children}
    </SheetContext.Provider>
  );

  if (RendererProvider) {
    return <RendererProvider>{content}</RendererProvider>;
  }

  return content;
}

export function useTrueSheet(): TrueSheetStaticMethods {
  const context = useContext(SheetContext);

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
