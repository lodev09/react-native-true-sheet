import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation';
import { useRouter } from 'expo-router';

import { SettingsSheetContent } from '@example/shared/screens';

export default function SettingsSheet() {
  const navigation = useTrueSheetNavigation();
  const router = useRouter();

  return (
    <SettingsSheetContent
      onResize={() => navigation.resize(1)}
      onOpenProfile={() => router.push('/sheet/profile')}
      onPop={() => navigation.pop()}
    />
  );
}
