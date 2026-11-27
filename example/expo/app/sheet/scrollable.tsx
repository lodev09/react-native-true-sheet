import { useEffect, useRef } from 'react';
import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation/expo-router';
import type { TrueSheetProps } from '@lodev09/react-native-true-sheet';
import { useRouter } from 'expo-router';

import { ScrollableSheetContent } from '@example/shared/screens';

// Scrolling content in a sheet screen — the ScrollView is created here, so it's
// plugged into the sheet via `setOptions` instead of the static screen options.
export default function ScrollableSheet() {
  const navigation = useTrueSheetNavigation();
  const router = useRouter();
  // Typed as the sheet prop: in this monorepo the library resolves the root's
  // react-native, whose `HostInstance` differs from this app's.
  const scrollableRef = useRef(null) as NonNullable<TrueSheetProps['scrollableRef']>;

  useEffect(() => {
    navigation.setOptions({ scrollableRef });
  }, [navigation]);

  return (
    <ScrollableSheetContent
      scrollableRef={scrollableRef}
      onResize={() => navigation.resize(1)}
      onPop={() => router.back()}
    />
  );
}
