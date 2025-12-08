import type { ParamListBase } from '@react-navigation/native';

import type {
  TrueSheetDescriptorMap,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationState,
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

interface TrueSheetViewProps {
  state: TrueSheetNavigationState<ParamListBase>;
  navigation: TrueSheetNavigationHelpers;
  descriptors: TrueSheetDescriptorMap;
  reanimated?: boolean;
}

export const TrueSheetView = ({
  state,
  navigation,
  descriptors,
  reanimated,
}: TrueSheetViewProps) => {
  // First route is the base screen, rest are sheets
  const [baseRoute, ...sheetRoutes] = state.routes;

  const baseDescriptor = baseRoute ? descriptors[baseRoute.key] : null;

  const ScreenComponent = reanimated ? getReanimatedScreen() : TrueSheetScreen;

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
};
