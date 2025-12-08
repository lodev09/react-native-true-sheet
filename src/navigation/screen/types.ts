import type { ParamListBase } from '@react-navigation/native';

import type {
  TrueSheetNavigationHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
} from '../types';

export type TrueSheetScreenProps = Omit<TrueSheetNavigationOptions, 'detentIndex'> & {
  detentIndex: number;
  resizeKey?: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  emit: TrueSheetNavigationHelpers['emit'];
  routeKey: string;
  closing?: boolean;
  children: React.ReactNode;
};
