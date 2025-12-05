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

import type { TrueSheetProps, SheetDetent } from '../TrueSheet.types';

export type TrueSheetNavigationEventMap = EventMapBase;

export type TrueSheetNavigationState<ParamList extends ParamListBase> = Omit<
  NavigationState<ParamList>,
  'routes'
> & {
  type: 'true-sheet';
  routes: (NavigationState<ParamList>['routes'][number] & {
    resizeIndex?: number | null;
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
export type TrueSheetNavigationOptions = {
  /**
   * The detent index to present at.
   * @default 0
   */
  detentIndex?: number;

  /**
   * The detents for the sheet.
   * @default ['auto']
   */
  detents?: SheetDetent[];

  /**
   * Main sheet background color.
   */
  backgroundColor?: TrueSheetProps['backgroundColor'];

  /**
   * The sheet corner radius.
   */
  cornerRadius?: TrueSheetProps['cornerRadius'];

  /**
   * Prevents interactive dismissal of the Sheet.
   * @default true
   */
  dismissible?: TrueSheetProps['dismissible'];

  /**
   * Enables or disables dragging the sheet to resize it.
   * @default true
   */
  draggable?: TrueSheetProps['draggable'];

  /**
   * Shows a native grabber on the sheet.
   * @default true
   */
  grabber?: TrueSheetProps['grabber'];

  /**
   * Options for customizing the grabber appearance.
   */
  grabberOptions?: TrueSheetProps['grabberOptions'];

  /**
   * Specify whether the sheet background is dimmed.
   * @default true
   */
  dimmed?: TrueSheetProps['dimmed'];

  /**
   * The detent index that the sheet should start to dim the background.
   * @default 0
   */
  dimmedDetentIndex?: TrueSheetProps['dimmedDetentIndex'];

  /**
   * The blur effect style on iOS.
   */
  blurTint?: TrueSheetProps['blurTint'];

  /**
   * Options for customizing the blur effect.
   */
  blurOptions?: TrueSheetProps['blurOptions'];

  /**
   * Overrides large or 100% height.
   */
  maxHeight?: TrueSheetProps['maxHeight'];

  /**
   * Allows the sheet to extend behind the status bar on Android.
   * @default false
   */
  edgeToEdgeFullScreen?: TrueSheetProps['edgeToEdgeFullScreen'];

  /**
   * Enables scrollable content support.
   * @default false
   */
  scrollable?: TrueSheetProps['scrollable'];

  /**
   * Keyboard mode for Android.
   * @default 'resize'
   */
  keyboardMode?: TrueSheetProps['keyboardMode'];

  /**
   * Controls sheet presentation style on iPad.
   * @default true
   */
  pageSizing?: TrueSheetProps['pageSizing'];

  /**
   * A component that is fixed at the top of the Sheet content.
   */
  header?: TrueSheetProps['header'];

  /**
   * A component that floats at the bottom of the Sheet.
   */
  footer?: TrueSheetProps['footer'];
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
