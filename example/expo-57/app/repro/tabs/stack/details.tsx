import { useRouter } from 'expo-router';

import { Button } from '@example/shared/components';

import { ReproScreen } from '../../../../components/ReproScreen';

export default function ReproTabStackDetails() {
  const router = useRouter();

  return (
    <ReproScreen
      title="Repro Details"
      description="No sheet should be on top of this screen, also after pushing a screen on the enclosing stack and going back."
    >
      <Button text="Push Screen" onPress={() => router.push('/repro/pushed')} />
      <Button text="Go Back" onPress={() => router.back()} />
    </ReproScreen>
  );
}
