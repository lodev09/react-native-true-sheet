import type { ParamListBase } from '@react-navigation/core';

import type { TrueSheetProps } from '../../TrueSheet.types';
import type {
  PositionChangeHandler,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationProp,
  TrueSheetNavigationSheetProps,
} from '../types';

export interface TrueSheetScreenProps extends TrueSheetNavigationSheetProps {
  detentIndex: number;
  resizeKey?: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  emit: TrueSheetNavigationHelpers['emit'];
  routeKey: string;
  closing?: boolean;
  detents: TrueSheetProps['detents'];
  children: React.ReactNode;
  positionChangeHandler?: PositionChangeHandler;
}
