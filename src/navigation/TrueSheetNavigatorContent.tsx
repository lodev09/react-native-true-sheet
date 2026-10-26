import type { NavigatorArgs } from 'standard-navigation';

import type {
  TrueSheetNavigationOptions,
  TrueSheetNavigatorContentExtraProps,
  TrueSheetStandardEventMap,
} from './types';
import { TrueSheetScreen } from './screen';
import { getReanimatedScreen } from './screen/reanimatedScreen';

const warnedRouteNames = new Set<string>();

const warnMissingReanimatedScreen = (routeName: string) => {
  if (!__DEV__ || warnedRouteNames.has(routeName)) return;
  warnedRouteNames.add(routeName);
  console.warn(
    `TrueSheet: the screen "${routeName}" sets \`reanimated: true\`, but the reanimated screen isn't enabled. ` +
      `Import '@lodev09/react-native-true-sheet/navigation/reanimated' once, before the navigator renders ` +
      '(e.g. at the top of your root layout). ' +
      'Until then, its `positionChangeHandler` runs on the JS thread.'
  );
};

const DEFAULT_DETENTS: ('auto' | number)[] = ['auto'];

const clampDetentIndex = (index: number, detentsLength: number): number =>
  Math.min(index, Math.max(detentsLength - 1, 0));

export type TrueSheetNavigatorContentProps = NavigatorArgs<
  TrueSheetNavigationOptions,
  TrueSheetStandardEventMap
> &
  TrueSheetNavigatorContentExtraProps;

export const TrueSheetNavigatorContent = ({
  routes,
  dispatch,
  descriptors,
  emitter,
}: TrueSheetNavigatorContentProps) => {
  // First route is the base screen, rest are sheets.
  // Rendered from the raw routes (not the standard state) so custom fields are
  // available and preloaded routes never present as sheets.
  const [baseRoute, ...sheetRoutes] = routes;

  const baseDescriptor = baseRoute ? descriptors[baseRoute.key] : null;

  return (
    <>
      {/* Render base screen */}
      {baseDescriptor?.render()}

      {/* Render sheet screens */}
      {sheetRoutes.map((route) => {
        const descriptor = descriptors[route.key];

        if (!descriptor) {
          return null;
        }

        const { options, render } = descriptor;
        const {
          detentIndex = 0,
          detents = DEFAULT_DETENTS,
          reanimated,
          positionChangeHandler,
          ...sheetProps
        } = options;
        const resolvedIndex = clampDetentIndex(route.resizeIndex ?? detentIndex, detents.length);

        const ReanimatedScreen = reanimated ? getReanimatedScreen() : null;
        if (reanimated && !ReanimatedScreen) warnMissingReanimatedScreen(route.name);

        if (ReanimatedScreen) {
          return (
            <ReanimatedScreen
              key={route.key}
              routeKey={route.key}
              closing={route.closing}
              detentIndex={resolvedIndex}
              resizeKey={route.resizeKey}
              detents={detents}
              dispatch={dispatch}
              emit={emitter.emit}
              positionChangeHandler={positionChangeHandler}
              {...sheetProps}
            >
              {render()}
            </ReanimatedScreen>
          );
        }

        return (
          <TrueSheetScreen
            key={route.key}
            routeKey={route.key}
            closing={route.closing}
            detentIndex={resolvedIndex}
            resizeKey={route.resizeKey}
            detents={detents}
            dispatch={dispatch}
            emit={emitter.emit}
            positionChangeHandler={positionChangeHandler}
            {...sheetProps}
          >
            {render()}
          </TrueSheetScreen>
        );
      })}
    </>
  );
};
