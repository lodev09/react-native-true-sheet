import { useRouter } from 'expo-router';

import { ModalScreen } from '../src/screens';

export default function Modal() {
  const router = useRouter();

  return (
    <ModalScreen
      onNavigateToTest={() => router.push('/test')}
      onDismiss={() => router.back()}
    />
  );
}
