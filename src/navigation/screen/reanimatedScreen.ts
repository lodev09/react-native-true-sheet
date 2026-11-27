import type { ComponentType } from 'react';

import type { TrueSheetScreenProps } from './types';

let reanimatedScreen: ComponentType<TrueSheetScreenProps> | null = null;

export const registerReanimatedScreen = (screen: ComponentType<TrueSheetScreenProps>) => {
  reanimatedScreen = screen;
};

export const getReanimatedScreen = () => reanimatedScreen;
