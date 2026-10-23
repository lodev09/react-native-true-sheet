import { useCallback, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button } from '@example/shared/components';
import { BlankSheet } from '@example/shared/sheets';

import { ReproScreen } from '../../components/ReproScreen';

const DISMISS_STACK_DELAY = 150;

export default function ReproDismissStack() {
  const router = useRouter();
  const sheetRef = useRef<TrueSheet>(null);
  const blurred = useRef(false);

  // Closes whatever the sheet presents on returning, after a short delay such as loading data, while the modal is
  // still animating out.
  useFocusEffect(
    useCallback(() => {
      if (blurred.current) setTimeout(() => sheetRef.current?.dismissStack(), DISMISS_STACK_DELAY);
      return () => {
        blurred.current = true;
      };
    }, [])
  );

  return (
    <ReproScreen
      title="Repro dismissStack"
      description="Open the modal, then dismiss it. The sheet calls dismissStack() as this screen refocuses. The sheet should stay presented."
    >
      <Button
        testID="open-modal"
        text="Open modal"
        onPress={() => router.push('/repro/dismiss-stack-modal')}
      />
      <BlankSheet
        ref={sheetRef}
        detents={['auto']}
        initialDetentIndex={0}
        dismissible={false}
        dimmed={false}
      />
    </ReproScreen>
  );
}
