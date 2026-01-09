import { TestScreen } from '@example/shared/screens';
import { useRouter } from 'expo-router';

export default function Test() {
  const router = useRouter();
  return <TestScreen onGoBack={() => router.back()} />;
}
