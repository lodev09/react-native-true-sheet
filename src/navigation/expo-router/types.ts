/**
 * Expo Router flavour of `../types`: same shapes, but bound to Expo Router's
 * vendored React Navigation types so apps that only install `expo-router` still
 * get real types instead of `any` — see `./base-types`.
 */
import type { TrueSheetActionType } from '../actions';
import type {
  TrueSheetActionHelpersOf,
  TrueSheetDispatch,
  TrueSheetNavigationEventMap,
  TrueSheetNavigationOptions,
  TrueSheetStateOf,
} from '../types';
import type {
  DefaultNavigatorOptions,
  NavigationAction,
  NavigationHelpers,
  NavigationProp,
  NavigationState,
  ParamListBase,
  RouteProp,
  Router,
  StackActionHelpers,
  StackRouterOptions,
} from './base-types';

export type TrueSheetRouterOptions = StackRouterOptions;

export type TrueSheetNavigationState<ParamList extends ParamListBase> = TrueSheetStateOf<
  NavigationState<ParamList>
>;

export type TrueSheetRouterState = TrueSheetNavigationState<ParamListBase>;

export type TrueSheetRouter = Router<TrueSheetRouterState, TrueSheetActionType>;

export type TrueSheetRouterFactory = (options: TrueSheetRouterOptions) => TrueSheetRouter;

/**
 * The base `StackRouter` factory to wrap — see `../types` for the shared contract.
 */
export type StackRouterFactory = <
  State extends NavigationState<ParamListBase>,
  Action extends NavigationAction,
>(
  options: TrueSheetRouterOptions
) => Router<State, Action>;

export type TrueSheetRoute = TrueSheetNavigationState<ParamListBase>['routes'][number];

/**
 * Props injected into the navigator content by Expo Router's `createProps`.
 * Raw routes carry the custom fields (`closing`, `resizeIndex`, `resizeKey`)
 * that the standard state strips out.
 */
export interface TrueSheetNavigatorContentExtraProps {
  routes: TrueSheetRoute[];
  dispatch: TrueSheetDispatch;
}

export type TrueSheetActionHelpers<ParamList extends ParamListBase> = TrueSheetActionHelpersOf<
  StackActionHelpers<ParamList>
>;

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

export type {
  PositionChangeHandler,
  TrueSheetDispatch,
  TrueSheetNavigationEventMap,
  TrueSheetNavigationOptions,
  TrueSheetNavigationSheetProps,
  TrueSheetStandardEventMap,
} from '../types';
