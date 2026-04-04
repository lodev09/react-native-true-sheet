import { forwardRef } from 'react';

import { getWebRenderer, setWebRenderer } from './web/registry';
import type { TrueSheetRefMethods, WebRenderer } from './web/types';
import type { TrueSheetProps } from './TrueSheet.types';

const TrueSheetComponent = forwardRef<TrueSheetRefMethods, TrueSheetProps>((props, ref) => {
  const { Sheet } = getWebRenderer();
  return <Sheet ref={ref} {...props} />;
});

const STATIC_METHOD_ERROR =
  'Static methods are not supported on web. Use the useTrueSheet() hook instead.';

interface TrueSheetStatic {
  present: (name: string, index?: number) => Promise<void>;
  dismiss: (name: string) => Promise<void>;
  dismissStack: (name: string) => Promise<void>;
  resize: (name: string, index: number) => Promise<void>;
  dismissAll: () => Promise<void>;
  setWebRenderer: (renderer: WebRenderer) => void;
}

export const TrueSheet = TrueSheetComponent as typeof TrueSheetComponent & TrueSheetStatic;

TrueSheet.present = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
TrueSheet.dismiss = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
TrueSheet.dismissStack = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
TrueSheet.resize = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
TrueSheet.dismissAll = async () => {
  throw new Error(STATIC_METHOD_ERROR);
};
TrueSheet.setWebRenderer = setWebRenderer;
