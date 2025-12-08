import type { ParamListBase } from '@react-navigation/native';

import type { TrueSheetProps } from '../../TrueSheet.types';
import type { TrueSheetNavigationHelpers, TrueSheetNavigationProp } from '../types';

export interface TrueSheetScreenProps {
  detentIndex: number;
  resizeKey?: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  emit: TrueSheetNavigationHelpers['emit'];
  routeKey: string;
  closing?: boolean;
  detents: TrueSheetProps['detents'];
  children: React.ReactNode;
  [key: string]: unknown;
}

export interface ReanimatedTrueSheetScreenProps extends TrueSheetScreenProps {
  reanimatedPositionChangeHandler?: TrueSheetProps['onPositionChange'];
}
