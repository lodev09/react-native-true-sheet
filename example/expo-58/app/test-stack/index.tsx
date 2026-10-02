import { useRouter } from 'expo-router';
import { TestScreen } from '@example/shared/screens';

export default function TestStackIndex() {
  const router = useRouter();
  return <TestScreen onGoBack={() => router.back()} />;
}
