import { useRef } from 'react';
import { useRouter } from 'expo-router';
import type { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button } from '@example/shared/components';
import { BlankSheet } from '@example/shared/sheets';

import { ReproScreen } from '../../../components/ReproScreen';

export default function ReproNested() {
  const router = useRouter();
  const sheet = useRef<TrueSheet>(null);

  return (
    <ReproScreen
      title="Repro Nested Stack"
      description="Hosts a sheet in a stack nested in a stack screen. The sheet should hide for a push on either stack, and only come back when this screen does."
    >
      <Button text="Present Sheet" onPress={() => sheet.current?.present()} />
      <Button text="Push Details" onPress={() => router.push('/repro/nested/details')} />
      <Button text="Push Screen" onPress={() => router.push('/repro/pushed')} />
      <BlankSheet ref={sheet} detents={['auto']} dimmed={false} />
    </ReproScreen>
  );
}
