import type { ParamListBase } from '@react-navigation/native';

import type {
  TrueSheetDescriptorMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationState,
} from './types';
import { TrueSheetScreen, ReanimatedTrueSheetScreen } from './screen';

const DEFAULT_DETENTS: ('auto' | number)[] = ['auto'];

function clampDetentIndex(index: number, detentsLength: number): number {
  return Math.min(index, Math.max(detentsLength - 1, 0));
}

interface TrueSheetViewProps {
  state: TrueSheetNavigationState<ParamListBase>;
  navigation: TrueSheetNavigationHelpers;
  descriptors: TrueSheetDescriptorMap;
  useReanimated?: boolean;
}

export function TrueSheetView({
  state,
  navigation,
  descriptors,
  useReanimated,
}: TrueSheetViewProps) {
  // First route is the base screen, rest are sheets
  const [baseRoute, ...sheetRoutes] = state.routes;

  const baseDescriptor = baseRoute ? descriptors[baseRoute.key] : null;

  const ScreenComponent = useReanimated ? ReanimatedTrueSheetScreen : TrueSheetScreen;

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

        const { options, navigation: screenNavigation, render } = descriptor;
        const { detentIndex = 0, detents = DEFAULT_DETENTS, ...sheetProps } = options;
        const resolvedIndex = clampDetentIndex(route.resizeIndex ?? detentIndex, detents.length);

        return (
          <ScreenComponent
            key={route.key}
            routeKey={route.key}
            closing={route.closing}
            detentIndex={resolvedIndex}
            resizeKey={route.resizeKey}
            detents={detents}
            navigation={screenNavigation}
            emit={navigation.emit}
            {...sheetProps}
          >
            {render()}
          </ScreenComponent>
        );
      })}
    </>
  );
}
