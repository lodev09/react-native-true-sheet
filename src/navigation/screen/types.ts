import type { ParamListBase } from '@react-navigation/native';

import type { PositionChangeEventPayload, TrueSheetProps } from '../../TrueSheet.types';
import type { TrueSheetNavigationHelpers, TrueSheetNavigationProp } from '../types';

export type PositionChangeHandler = (payload: PositionChangeEventPayload) => void;

export interface TrueSheetScreenProps {
  detentIndex: number;
  resizeKey?: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  emit: TrueSheetNavigationHelpers['emit'];
  routeKey: string;
  closing?: boolean;
  detents: TrueSheetProps['detents'];
  children: React.ReactNode;
  positionChangeHandler?: PositionChangeHandler;
  [key: string]: unknown;
}
