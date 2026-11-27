import { useRouter } from 'expo-router';

import { Button } from '@example/shared/components';

import { ReproScreen } from '../../components/ReproScreen';

export default function ReproDismissStackModal() {
  const router = useRouter();

  return (
    <ReproScreen
      title="Repro Modal"
      description="Presented over the sheet. The screen below calls dismissStack() while this modal animates out."
    >
      <Button text="Dismiss" onPress={() => router.back()} />
    </ReproScreen>
  );
}
