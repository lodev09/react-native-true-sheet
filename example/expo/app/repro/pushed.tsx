import { useRouter } from 'expo-router';

import { Button } from '@example/shared/components';

import { ReproScreen } from '../../components/ReproScreen';

export default function ReproPushed() {
  const router = useRouter();

  return (
    <ReproScreen
      title="Repro Pushed"
      description="Pushed on the stack enclosing the tabs. No sheet should be on top of this screen."
    >
      <Button text="Go Back" onPress={() => router.back()} />
    </ReproScreen>
  );
}
