export type TrueSheetActionType =
  | {
      type: 'PUSH';
      payload: { name: string; params?: object };
      source?: string;
      target?: string;
    }
  | {
      type: 'POP';
      payload: { count: number };
      source?: string;
      target?: string;
    }
  | {
      type: 'POP_TO';
      payload: { name: string; params?: object; merge?: boolean };
      source?: string;
      target?: string;
    }
  | {
      type: 'POP_TO_TOP';
      source?: string;
      target?: string;
    }
  | {
      type: 'REPLACE';
      payload: { name: string; params?: object };
      source?: string;
      target?: string;
    }
  | {
      type: 'GO_BACK';
      source?: string;
      target?: string;
    }
  | {
      type: 'RESIZE';
      index: number;
      source?: string;
      target?: string;
    }
  | {
      type: 'DISMISS';
      source?: string;
      target?: string;
    }
  | {
      type: 'REMOVE';
      source?: string;
      target?: string;
    };

/**
 * Action creators for the TrueSheet navigator.
 * Plain objects matching `StackActions` shapes, plus sheet-specific actions.
 */
export const TrueSheetActions = {
  push: (name: string, params?: object): TrueSheetActionType => ({
    type: 'PUSH',
    payload: { name, params },
  }),
  pop: (count: number = 1): TrueSheetActionType => ({
    type: 'POP',
    payload: { count },
  }),
  popTo: (name: string, params?: object, options?: { merge?: boolean }): TrueSheetActionType => ({
    type: 'POP_TO',
    payload: { name, params, merge: options?.merge },
  }),
  popToTop: (): TrueSheetActionType => ({ type: 'POP_TO_TOP' }),
  replace: (name: string, params?: object): TrueSheetActionType => ({
    type: 'REPLACE',
    payload: { name, params },
  }),
  resize: (index: number): TrueSheetActionType => ({ type: 'RESIZE', index }),
  dismiss: (): TrueSheetActionType => ({ type: 'DISMISS' }),
  remove: (): TrueSheetActionType => ({ type: 'REMOVE' }),
};
