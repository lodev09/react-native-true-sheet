export type TrueSheetRefMethods = {
  present(index?: number): Promise<void>;
  dismiss(): Promise<void>;
  resize(index: number): Promise<void>;
  dismissStack(): Promise<void>;
};
