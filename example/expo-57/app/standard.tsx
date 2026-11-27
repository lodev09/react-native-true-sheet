import { useRouter } from 'expo-router';

import { StandardScreen } from '@example/shared/screens';

export default function Standard() {
  const router = useRouter();

  return (
    <StandardScreen
      onNavigateToTest={() => router.push('/modal/test')}
      onNavigateToModal={() => router.push('/modal')}
      onNavigateToMap={() => router.push('/')}
    />
  );
}
