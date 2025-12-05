import type {
  DefaultNavigatorOptions,
  Descriptor,
  EventMapBase,
  NavigationHelpers,
  NavigationProp,
  NavigationState,
  ParamListBase,
  RouteProp,
  StackActionHelpers,
} from '@react-navigation/native';

import type { TrueSheetProps } from '../TrueSheet.types';

export type TrueSheetNavigationEventMap = EventMapBase;

export type TrueSheetNavigationState<ParamList extends ParamListBase> = Omit<
  NavigationState<ParamList>,
  'routes'
> & {
  type: 'true-sheet';
  routes: (NavigationState<ParamList>['routes'][number] & {
    resizeIndex?: number | null;
    resizeKey?: number;
    closing?: boolean;
  })[];
};

export type TrueSheetActionHelpers<ParamList extends ParamListBase> =
  StackActionHelpers<ParamList> & {
    /**
     * Resize the sheet to a specific detent index.
     */
    resize(index?: number): void;
  };

export type TrueSheetNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string,
  NavigatorID extends string | undefined = undefined,
> = NavigationProp<
  ParamList,
  RouteName,
  NavigatorID,
  TrueSheetNavigationState<ParamList>,
  TrueSheetNavigationOptions,
  TrueSheetNavigationEventMap
> &
  TrueSheetActionHelpers<ParamList>;

export type TrueSheetScreenProps<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string,
  NavigatorID extends string | undefined = undefined,
> = {
  navigation: TrueSheetNavigationProp<ParamList, RouteName, NavigatorID>;
  route: RouteProp<ParamList, RouteName>;
};

export type TrueSheetNavigationHelpers = NavigationHelpers<
  ParamListBase,
  TrueSheetNavigationEventMap
>;

export type TrueSheetNavigationConfig = Record<string, unknown>;

/**
 * Screen options for TrueSheet navigator screens.
 */
export type TrueSheetNavigationOptions = Pick<
  TrueSheetProps,
  | 'detents'
  | 'backgroundColor'
  | 'cornerRadius'
  | 'dismissible'
  | 'draggable'
  | 'grabber'
  | 'grabberOptions'
  | 'dimmed'
  | 'dimmedDetentIndex'
  | 'blurTint'
  | 'blurOptions'
  | 'maxHeight'
  | 'edgeToEdgeFullScreen'
  | 'scrollable'
  | 'keyboardMode'
  | 'pageSizing'
  | 'header'
  | 'footer'
> & {
  /**
   * The detent index to present at.
   * @default 0
   */
  detentIndex?: number;
};

export type TrueSheetNavigatorProps = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  TrueSheetNavigationState<ParamListBase>,
  TrueSheetNavigationOptions,
  TrueSheetNavigationEventMap,
  unknown
> &
  TrueSheetNavigationConfig;

export type TrueSheetDescriptor = Descriptor<
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp<ParamListBase>,
  RouteProp<ParamListBase>
>;

export type TrueSheetDescriptorMap = {
  [key: string]: TrueSheetDescriptor;
};
