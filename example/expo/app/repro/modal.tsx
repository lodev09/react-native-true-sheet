import { useRouter } from 'expo-router';

import { Button } from '@example/shared/components';

import { ReproScreen } from '../../components/ReproScreen';

export default function ReproModal() {
  const router = useRouter();

  return (
    <ReproScreen
      title="Repro Modal"
      description="No sheet should be on top of this modal. The base sheet should present after dismissing."
    >
      <Button text="Dismiss" onPress={() => router.back()} />
    </ReproScreen>
  );
}
