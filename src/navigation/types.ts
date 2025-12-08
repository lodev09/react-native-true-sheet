import type {
  DefaultNavigatorOptions,
  Descriptor,
  NavigationHelpers,
  NavigationProp,
  NavigationState,
  ParamListBase,
  RouteProp,
  StackActionHelpers,
} from '@react-navigation/native';

import type {
  DetentInfoEventPayload,
  PositionChangeEventPayload,
  PositionChangeEvent,
  TrueSheetProps,
} from '../TrueSheet.types';

export type TrueSheetNavigationEventMap = {
  /**
   * Event fired when the sheet is about to be presented.
   */
  sheetWillPresent: { data: DetentInfoEventPayload };
  /**
   * Event fired when the sheet has been presented.
   */
  sheetDidPresent: { data: DetentInfoEventPayload };
  /**
   * Event fired when the sheet is about to be dismissed.
   */
  sheetWillDismiss: { data: undefined };
  /**
   * Event fired when the sheet has been dismissed.
   */
  sheetDidDismiss: { data: undefined };
  /**
   * Event fired when the sheet's detent changes.
   */
  sheetDetentChange: { data: DetentInfoEventPayload };
  /**
   * Event fired when the user starts dragging the sheet.
   */
  sheetDragBegin: { data: DetentInfoEventPayload };
  /**
   * Event fired while the user is dragging the sheet.
   */
  sheetDragChange: { data: DetentInfoEventPayload };
  /**
   * Event fired when the user stops dragging the sheet.
   */
  sheetDragEnd: { data: DetentInfoEventPayload };
  /**
   * Event fired when the sheet's position changes.
   */
  sheetPositionChange: { data: PositionChangeEventPayload };
  /**
   * Event fired when the sheet is about to regain focus.
   */
  sheetWillFocus: { data: undefined };
  /**
   * Event fired when the sheet regains focus.
   */
  sheetDidFocus: { data: undefined };
  /**
   * Event fired when the sheet is about to lose focus.
   */
  sheetWillBlur: { data: undefined };
  /**
   * Event fired when the sheet loses focus.
   */
  sheetDidBlur: { data: undefined };
};

export type TrueSheetNavigationState<ParamList extends ParamListBase> = Omit<
  NavigationState<ParamList>,
  'routes'
> & {
  type: 'true-sheet';
  routes: (NavigationState<ParamList>['routes'][number] & {
    resizeIndex?: number;
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

  /**
   * Use ReanimatedTrueSheet for this screen.
   * Enables worklet-based `onPositionChange` events.
   *
   * @default false
   */
  reanimated?: boolean;

  /**
   * A reanimated position change handler created by `useReanimatedPositionChangeHandler`.
   * Only used when `reanimated` is enabled.
   *
   * @example
   * ```tsx
   * const positionHandler = useReanimatedPositionChangeHandler((payload) => {
   *   'worklet';
   *   animatedValue.value = payload.position;
   * });
   *
   * <Navigator.Screen
   *   name="Sheet"
   *   options={{
   *     reanimated: true,
   *     reanimatedPositionChangeHandler: positionHandler,
   *   }}
   * />
   * ```
   */
  reanimatedPositionChangeHandler?: (e: PositionChangeEvent) => void;
};

export type TrueSheetNavigatorProps = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  TrueSheetNavigationState<ParamListBase>,
  TrueSheetNavigationOptions,
  TrueSheetNavigationEventMap,
  unknown
> & {
  /**
   * The name of the route to use as the base screen.
   * This screen will be rendered as a regular screen, while other screens are presented as sheets.
   * Defaults to the first screen defined in the navigator.
   */
  initialRouteName?: string;
};

export type TrueSheetDescriptor = Descriptor<
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp<ParamListBase>,
  RouteProp<ParamListBase>
>;

export type TrueSheetDescriptorMap = {
  [key: string]: TrueSheetDescriptor;
};
