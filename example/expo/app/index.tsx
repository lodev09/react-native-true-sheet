import { useRouter } from 'expo-router';

import { MapScreen } from '../src/screens';
import { Map } from '../src/components';

export default function Index() {
  const router = useRouter();

  return (
    <MapScreen
      MapComponent={Map}
      onNavigateToModal={() => router.push('/modal')}
      onNavigateToSheetStack={() => router.push('/sheet-stack')}
    />
  );
}
