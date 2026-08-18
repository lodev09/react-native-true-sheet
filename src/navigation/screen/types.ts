import type { TrueSheetProps } from '../../TrueSheet.types';
import type {
  PositionChangeHandler,
  TrueSheetDispatch,
  TrueSheetEmitFn,
  TrueSheetNavigationSheetProps,
} from '../types';

export interface TrueSheetScreenProps extends TrueSheetNavigationSheetProps {
  detentIndex: number;
  resizeKey?: number;
  dispatch: TrueSheetDispatch;
  emit: TrueSheetEmitFn;
  routeKey: string;
  closing?: boolean;
  detents: TrueSheetProps['detents'];
  children: React.ReactNode;
  positionChangeHandler?: PositionChangeHandler;
}
