import type { ParamListBase } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef } from 'react';

import { TrueSheet } from '../TrueSheet';
import type {
  TrueSheetDescriptorMap,
  TrueSheetNavigationOptions,
  TrueSheetNavigationProp,
  TrueSheetNavigationState,
} from './types';
import { TrueSheetActions } from './TrueSheetRouter';

type TrueSheetScreenProps = Omit<TrueSheetNavigationOptions, 'detentIndex'> & {
  detentIndex?: number;
  resizeKey?: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  routeKey: string;
  closing?: boolean;
  children: React.ReactNode;
};

function TrueSheetScreen({
  detentIndex = 0,
  resizeKey,
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
  const hasMountedRef = useRef(false);

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

  // Present on mount
  useEffect(() => {
    hasMountedRef.current = true;
    ref.current?.present(lastIndexRef.current);
  }, []);

  // Handle detentIndex changes (resize)
  // resizeKey changes on every resize action, even if index is the same
  useEffect(() => {
    // Skip if not mounted yet - onMount will handle initial present
    if (!hasMountedRef.current) return;

    if (detentIndex != null && lastIndexRef.current !== detentIndex) {
      lastIndexRef.current = detentIndex;
      ref.current?.resize(detentIndex);
    }
  }, [detentIndex, resizeKey]);

  const onDetentChange = useCallback((event: { nativeEvent: { index: number } }) => {
    // Only track the current index locally for user drags
    // We don't update navigation state here to avoid blocking programmatic resizes
    lastIndexRef.current = event.nativeEvent.index;
  }, []);

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

interface TrueSheetViewProps {
  state: TrueSheetNavigationState<ParamListBase>;
  descriptors: TrueSheetDescriptorMap;
}

export function TrueSheetView({ state, descriptors }: TrueSheetViewProps) {
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
            resizeKey={route.resizeKey}
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
