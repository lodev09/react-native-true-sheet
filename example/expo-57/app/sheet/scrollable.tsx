import { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation/expo-router';
import { useRouter } from 'expo-router';

import { ScrollableSheetContent } from '@example/shared/screens';

// Scrolling content in a sheet screen — the ScrollView is created here, so it's
// plugged into the sheet via `setOptions` instead of the static screen options.
export default function ScrollableSheet() {
  const navigation = useTrueSheetNavigation();
  const router = useRouter();
  const scrollableRef = useRef<ScrollView>(null);

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
