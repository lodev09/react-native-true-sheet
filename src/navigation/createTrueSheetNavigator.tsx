import {
  createNavigatorFactory,
  type NavigatorTypeBagBase,
  type ParamListBase,
  type StaticConfig,
  type TypedNavigator,
  useNavigationBuilder,
} from '@react-navigation/native';

import { TrueSheetRouter, type TrueSheetRouterOptions } from './TrueSheetRouter';
import { TrueSheetView } from './TrueSheetView';
import type {
  TrueSheetActionHelpers,
  TrueSheetNavigationEventMap,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
  TrueSheetNavigatorProps,
} from './types';

function TrueSheetNavigator({
  id,
  initialRouteName,
  children,
  screenListeners,
  screenOptions,
}: TrueSheetNavigatorProps) {
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    TrueSheetNavigationState<ParamListBase>,
    TrueSheetRouterOptions,
    TrueSheetActionHelpers<ParamListBase>,
    TrueSheetNavigationOptions,
    TrueSheetNavigationEventMap
  >(TrueSheetRouter, {
    id,
    initialRouteName,
    children,
    screenListeners,
    screenOptions,
  });

  return (
    <NavigationContent>
      <TrueSheetView state={state} navigation={navigation} descriptors={descriptors} />
    </NavigationContent>
  );
}

/**
 * Creates a TrueSheet navigator.
 *
 * @example
 * ```tsx
 * const Sheet = createTrueSheetNavigator();
 *
 * function App() {
 *   return (
 *     <Sheet.Navigator>
 *       <Sheet.Screen name="Home" component={HomeScreen} />
 *       <Sheet.Screen
 *         name="Details"
 *         component={DetailsSheet}
 *         options={{ detents: [0.5, 1] }}
 *       />
 *     </Sheet.Navigator>
 *   );
 * }
 * ```
 */
export const createTrueSheetNavigator = <
  const ParamList extends ParamListBase,
  const NavigatorID extends string | undefined = undefined,
  const TypeBag extends NavigatorTypeBagBase = {
    ParamList: ParamList;
    NavigatorID: NavigatorID;
    State: TrueSheetNavigationState<ParamList>;
    ScreenOptions: TrueSheetNavigationOptions;
    EventMap: TrueSheetNavigationEventMap;
    NavigationList: {
      [RouteName in keyof ParamList]: TrueSheetNavigationProp<ParamList, RouteName, NavigatorID>;
    };
    Navigator: typeof TrueSheetNavigator;
  },
  const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(
  config?: Config
): TypedNavigator<TypeBag, Config> => {
  return createNavigatorFactory(TrueSheetNavigator)(config);
};
