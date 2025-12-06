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
  detentIndex: number;
  resizeKey?: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  routeKey: string;
  closing?: boolean;
  children: React.ReactNode;
};

function TrueSheetScreen({
  detentIndex,
  resizeKey,
  navigation,
  routeKey,
  closing,
  detents,
  children,
  ...sheetProps
}: TrueSheetScreenProps) {
  const ref = useRef<TrueSheet>(null);
  const isDismissedRef = useRef(false);
  const isFirstRenderRef = useRef(true);
  // Capture initial detent index only once
  const initialDetentIndexRef = useRef(detentIndex);

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

  // Handle resize - resizeKey ensures effect runs even when resizing to same index
  useEffect(() => {
    // Skip first render - initialDetentIndex handles initial presentation
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    ref.current?.resize(detentIndex);
  }, [detentIndex, resizeKey]);

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
      initialDetentIndex={initialDetentIndexRef.current}
      detents={detents}
      onDidDismiss={onDismiss}
      {...sheetProps}
    >
      {children}
    </TrueSheet>
  );
}

const DEFAULT_DETENTS: ('auto' | number)[] = ['auto'];

function clampDetentIndex(index: number, detentsLength: number): number {
  return Math.min(index, Math.max(detentsLength - 1, 0));
}

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
        const { detentIndex = 0, detents = DEFAULT_DETENTS, ...sheetProps } = options;
        const resolvedIndex = clampDetentIndex(route.resizeIndex ?? detentIndex, detents.length);

        return (
          <TrueSheetScreen
            key={route.key}
            routeKey={route.key}
            closing={route.closing}
            detentIndex={resolvedIndex}
            resizeKey={route.resizeKey}
            detents={detents}
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
