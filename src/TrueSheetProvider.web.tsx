import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from 'react';

import type { TrueSheetMethods, TrueSheetStaticMethods } from './TrueSheet.types';

type SheetRef = RefObject<TrueSheetMethods | null>;
type NodeRef = RefObject<HTMLDivElement | null>;

interface StackEntry {
  ref: SheetRef;
  nodeRef: NodeRef;
}

interface SheetContextValue {
  registerByName: (name: string, ref: SheetRef) => () => void;
  resolveByName: (name: string) => TrueSheetMethods;
  pushOpen: (entry: StackEntry) => void;
  popOpen: (entry: StackEntry) => void;
  subscribeStack: (listener: () => void) => () => void;
  getStackSnapshot: () => readonly StackEntry[];
}

const SheetContext = createContext<SheetContextValue | null>(null);

const NO_PROVIDER_ERROR =
  'TrueSheet: useTrueSheet() requires a <TrueSheetProvider> ancestor on web.';

const EMPTY_STACK: readonly StackEntry[] = Object.freeze([]);

export interface TrueSheetProviderProps {
  children: ReactNode;
}

export function TrueSheetProvider({ children }: TrueSheetProviderProps) {
  const namedSheetsRef = useRef<Map<string, SheetRef>>(new Map());
  const stackRef = useRef<readonly StackEntry[]>(EMPTY_STACK);
  const listenersRef = useRef<Set<() => void>>(new Set());

  const value = useMemo<SheetContextValue>(() => {
    const notify = () => listenersRef.current.forEach((listener) => listener());

    return {
      registerByName: (name, ref) => {
        namedSheetsRef.current.set(name, ref);
        return () => {
          if (namedSheetsRef.current.get(name) === ref) {
            namedSheetsRef.current.delete(name);
          }
        };
      },
      resolveByName: (name) => {
        const ref = namedSheetsRef.current.get(name);
        const methods = ref?.current;
        if (!methods) {
          throw new Error(`TrueSheet: no sheet registered with name "${name}"`);
        }
        return methods;
      },
      pushOpen: (entry) => {
        if (stackRef.current.some((e) => e.ref === entry.ref)) return;
        stackRef.current = [...stackRef.current, entry];
        notify();
      },
      popOpen: (entry) => {
        const idx = stackRef.current.findIndex((e) => e.ref === entry.ref);
        if (idx < 0) return;
        stackRef.current = [...stackRef.current.slice(0, idx), ...stackRef.current.slice(idx + 1)];
        notify();
      },
      subscribeStack: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      },
      getStackSnapshot: () => stackRef.current,
    };
  }, []);

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function useTrueSheet(): TrueSheetStaticMethods {
  const ctx = useContext(SheetContext);

  return useMemo<TrueSheetStaticMethods>(() => {
    if (!ctx) {
      const reject = async (): Promise<never> => {
        throw new Error(NO_PROVIDER_ERROR);
      };
      return {
        present: reject,
        resize: reject,
        dismiss: reject,
        dismissStack: reject,
        dismissAll: reject,
      };
    }

    return {
      present: (name, index, animated) => ctx.resolveByName(name).present(index, animated),
      resize: (name, index) => ctx.resolveByName(name).resize(index),
      dismiss: (name, animated) => ctx.resolveByName(name).dismiss(animated),
      dismissStack: (name, animated) => ctx.resolveByName(name).dismissStack(animated),
      dismissAll: async (animated) => {
        const stack = ctx.getStackSnapshot();
        await Promise.all(
          [...stack].reverse().map((entry) => entry.ref.current?.dismiss(animated))
        );
      },
    };
  }, [ctx]);
}

export function useRegisterSheet(name: string | undefined, ref: SheetRef): void {
  const ctx = useContext(SheetContext);
  useEffect(() => {
    if (!ctx || !name) return;
    return ctx.registerByName(name, ref);
  }, [ctx, name, ref]);
}

/**
 * Registers the sheet in the open stack while `isOpen` is true and returns
 * live data used by each sheet to render stacked visuals and dismiss children.
 */
export function useSheetStack(ref: SheetRef, nodeRef: NodeRef, isOpen: boolean) {
  const ctx = useContext(SheetContext);

  const entry = useMemo<StackEntry>(() => ({ ref, nodeRef }), [ref, nodeRef]);

  useEffect(() => {
    if (!ctx || !isOpen) return;
    ctx.pushOpen(entry);
    return () => ctx.popOpen(entry);
  }, [ctx, entry, isOpen]);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!ctx) return () => {};
      return ctx.subscribeStack(listener);
    },
    [ctx]
  );

  const getSnapshot = useCallback(() => (ctx ? ctx.getStackSnapshot() : EMPTY_STACK), [ctx]);

  const stack = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const stackIndex = stack.findIndex((e) => e.ref === ref);
  const isNested = stackIndex > 0;
  const descendants = useMemo<readonly StackEntry[]>(
    () => (stackIndex < 0 ? EMPTY_STACK : stack.slice(stackIndex + 1)),
    [stack, stackIndex]
  );

  const dismissAbove = useCallback(
    async (animated?: boolean) => {
      if (!ctx) return;
      const snapshot = ctx.getStackSnapshot();
      const idx = snapshot.findIndex((e) => e.ref === ref);
      if (idx < 0) return;
      const above = snapshot.slice(idx + 1);
      await Promise.all(
        [...above].reverse().map((e) => e.ref.current?.dismiss(animated))
      );
    },
    [ctx, ref]
  );

  return { descendants, isNested, dismissAbove };
}
