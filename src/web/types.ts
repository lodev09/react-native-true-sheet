import type { ForwardRefExoticComponent, RefAttributes, ComponentType, ReactNode } from 'react';
import type { TrueSheetProps } from '../TrueSheet.types';

export type TrueSheetRefMethods = {
  present(index?: number): Promise<void>;
  dismiss(): Promise<void>;
  resize(index: number): Promise<void>;
  dismissStack(): Promise<void>;
};

export interface WebRenderer {
  /** The sheet component that renders the drawer */
  Sheet: ForwardRefExoticComponent<TrueSheetProps & RefAttributes<TrueSheetRefMethods>>;
  /** Optional wrapper rendered inside the provider (e.g. gorhom needs BottomSheetModalProvider) */
  Provider?: ComponentType<{ children: ReactNode }>;
}
