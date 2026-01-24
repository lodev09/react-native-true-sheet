import { useTrueSheetNavigation } from '@lodev09/react-native-true-sheet/navigation';

import { NotificationsSheetContent } from '@example/shared/screens';

export default function NotificationsSheet() {
  const navigation = useTrueSheetNavigation();

  return (
    <NotificationsSheetContent
      onPop={() => navigation.pop()}
      onPop2={() => navigation.pop(2)}
      onPopToSettings={() => navigation.popTo('settings')}
      onPopToDetails={() => navigation.popTo('details')}
      onPopToTop={() => navigation.popToTop()}
    />
  );
}
