import { useRouter } from 'expo-router';

import { StandardScreen } from '../src/screens';

export default function Standard() {
  const router = useRouter();

  return (
    <StandardScreen
      onNavigateToTest={() => router.push('/test')}
      onNavigateToModal={() => router.push('/modal')}
      onNavigateToMap={() => router.push('/')}
    />
  );
}
