import type { NavigatorArgs } from 'standard-navigation';

import type {
  TrueSheetNavigationOptions,
  TrueSheetNavigatorContentExtraProps,
  TrueSheetStandardEventMap,
} from './types';
import { TrueSheetScreen, type TrueSheetScreenProps } from './screen';

let ReanimatedTrueSheetScreen: React.ComponentType<TrueSheetScreenProps> | null = null;

const getReanimatedScreen = (): React.ComponentType<TrueSheetScreenProps> => {
  if (!ReanimatedTrueSheetScreen) {
    ReanimatedTrueSheetScreen =
      require('./screen/ReanimatedTrueSheetScreen').ReanimatedTrueSheetScreen;
  }
  return ReanimatedTrueSheetScreen!;
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

        if (reanimated) {
          const ReanimatedScreen = getReanimatedScreen();
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
