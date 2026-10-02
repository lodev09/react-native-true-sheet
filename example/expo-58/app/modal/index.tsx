import { useRouter } from 'expo-router';

import { ModalScreen } from '@example/shared/screens';

export default function Modal() {
  const router = useRouter();

  return (
    <ModalScreen
      onNavigateToTest={() => router.push('/modal/test')}
      onDismiss={() => router.back()}
    />
  );
}
