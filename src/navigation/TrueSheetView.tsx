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

type TrueSheetScreenProps = Omit<TrueSheetNavigationOptions, 'detentIndex'> & {
  detentIndex: number;
  navigation: TrueSheetNavigationProp<ParamListBase>;
  routeKey: string;
  children: React.ReactNode;
};

function TrueSheetScreen({
  detentIndex,
  navigation,
  routeKey,
  detents,
  children,
  ...sheetProps
}: TrueSheetScreenProps) {
  const ref = useRef<TrueSheet>(null);
  const lastIndexRef = useRef(detentIndex);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle detentIndex changes (snapTo)
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
    // TrueSheet will call onDidDismiss on unmount, but we do not want that since
    // we already popped the screen.
    if (isMounted.current) {
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

  return (
    <>
      {firstScreen.render()}
      {state.routes.slice(1).map((route) => {
        const descriptor = descriptors[route.key];

        if (!descriptor) {
          return null;
        }

        const { options, navigation, render } = descriptor;
        const { detentIndex, detents, ...sheetProps } = options;

        return (
          <TrueSheetScreen
            key={route.key}
            routeKey={route.key}
            // Make sure index is in range, it could be out if resizeIndex is persisted
            // and detents is changed.
            detentIndex={Math.min(
              route.resizeIndex ?? detentIndex ?? 0,
              detents != null ? detents.length - 1 : 0
            )}
            detents={detents ?? DEFAULT_DETENTS}
            navigation={navigation}
            {...sheetProps}
          >
            {render()}
          </TrueSheetScreen>
        );
      })}
    </>
  );
}
