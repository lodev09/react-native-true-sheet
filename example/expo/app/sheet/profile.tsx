import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation';
import { useRouter } from 'expo-router';

import { ProfileSheetContent } from '@example/shared/screens';

export default function ProfileSheet() {
  const navigation = useTrueSheetNavigation();
  const router = useRouter();

  return (
    <ProfileSheetContent
      onOpenNotifications={() => router.push('/sheet/notifications')}
      onPop={() => navigation.pop()}
      onPop2={() => navigation.pop(2)}
      onPopToTop={() => navigation.popToTop()}
    />
  );
}
