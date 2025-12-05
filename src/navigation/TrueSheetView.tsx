import type { ParamListBase } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef } from 'react';

import { TrueSheet } from '../TrueSheet';
import type {
  TrueSheetDescriptorMap,
  TrueSheetNavigationConfig,
  TrueSheetNavigationHelpers,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
} from './types';
import { TrueSheetActions } from './TrueSheetRouter';

type TrueSheetScreenProps = Omit<TrueSheetNavigationOptions, 'detentIndex'> & {
  detentIndex: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  routeKey: string;
  closing?: boolean;
  children: React.ReactNode;
};

function TrueSheetScreen({
  detentIndex,
  navigation,
  routeKey,
  closing,
  detents,
  children,
  ...sheetProps
}: TrueSheetScreenProps) {
  const ref = useRef<TrueSheet>(null);
  const lastIndexRef = useRef(detentIndex);
  const isDismissedRef = useRef(false);

  // Handle closing state change - dismiss the sheet and wait for animation
  useEffect(() => {
    if (closing && !isDismissedRef.current) {
      isDismissedRef.current = true;
      (async () => {
        await ref.current?.dismiss();
        navigation.dispatch({ ...TrueSheetActions.remove(), source: routeKey });
      })();
    } else if (closing && isDismissedRef.current) {
      // Sheet was already dismissed by user swipe, just remove
      navigation.dispatch({ ...TrueSheetActions.remove(), source: routeKey });
    }
  }, [closing, navigation, routeKey]);

  // Handle detentIndex changes (resize)
  useEffect(() => {
    if (detentIndex != null && lastIndexRef.current !== detentIndex) {
      ref.current?.resize(detentIndex);
      lastIndexRef.current = detentIndex;
    }
  }, [detentIndex]);

  const onDetentChange = useCallback(
    (event: { nativeEvent: { index: number } }) => {
      const newIndex = event.nativeEvent.index;
      const currentIndex = lastIndexRef.current;
      lastIndexRef.current = newIndex;

      if (newIndex >= 0 && newIndex !== currentIndex) {
        navigation.resize(newIndex);
      }
    },
    [navigation]
  );

  const onDismiss = useCallback(() => {
    // User dismissed the sheet by swiping down
    if (!isDismissedRef.current) {
      isDismissedRef.current = true;
      navigation.goBack();
    }
  }, [navigation]);

  return (
    <TrueSheet
      ref={ref}
      name={`navigation-sheet-${routeKey}`}
      initialDetentIndex={detentIndex}
      detents={detents}
      onDetentChange={onDetentChange}
      onDidDismiss={onDismiss}
      {...sheetProps}
    >
      {children}
    </TrueSheet>
  );
}

const DEFAULT_DETENTS: ('auto' | number)[] = ['auto'];

type Props = TrueSheetNavigationConfig & {
  state: TrueSheetNavigationState<ParamListBase>;
  navigation: TrueSheetNavigationHelpers;
  descriptors: TrueSheetDescriptorMap;
};

export function TrueSheetView({ state, descriptors }: Props) {
  const firstScreenKey = state.routes[0]?.key;
  const firstScreen = firstScreenKey ? descriptors[firstScreenKey] : undefined;

  if (!firstScreen) {
    return null;
  }

  // Sheet routes (excluding first screen which is rendered as content)
  const sheetRoutes = state.routes.slice(1);

  return (
    <>
      {firstScreen.render()}
      {sheetRoutes.map((route) => {
        const descriptor = descriptors[route.key];

        if (!descriptor) {
          return null;
        }

        const { options, navigation: screenNavigation, render } = descriptor;
        const { detentIndex, detents, ...sheetProps } = options;

        return (
          <TrueSheetScreen
            key={route.key}
            routeKey={route.key}
            closing={route.closing}
            detentIndex={Math.min(
              route.resizeIndex ?? detentIndex ?? 0,
              detents != null ? detents.length - 1 : 0
            )}
            detents={detents ?? DEFAULT_DETENTS}
            navigation={screenNavigation}
            {...sheetProps}
          >
            {render()}
          </TrueSheetScreen>
        );
      })}
    </>
  );
}
