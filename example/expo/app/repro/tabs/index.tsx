import { useRef } from 'react';
import { useRouter } from 'expo-router';
import type { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button } from '@example/shared/components';
import { BlankSheet } from '@example/shared/sheets';

import { ReproScreen } from '../../../components/ReproScreen';

export default function ReproTab() {
  const router = useRouter();
  const sheet = useRef<TrueSheet>(null);

  return (
    <ReproScreen
      title="Repro Tab"
      description="Hosts a sheet in a tab screen. Pushing a screen on the enclosing stack should hide the sheet, and going back should restore it."
    >
      <Button text="Present Sheet" onPress={() => sheet.current?.present()} />
      <Button text="Push Screen" onPress={() => router.push('/repro/pushed')} />
      <Button text="Open Nested Stack" onPress={() => router.push('/repro/nested')} />
      <BlankSheet ref={sheet} detents={['auto']} dimmed={false} />
    </ReproScreen>
  );
}
