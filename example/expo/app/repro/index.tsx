import { BlankSheet } from '@example/shared/sheets';

import {
  ReproScreen,
  useDelayedMount,
  useFocusedInitialDetentIndex,
} from '../../components/ReproScreen';

export default function ReproIndex() {
  const sheetMounted = useDelayedMount();
  const initialDetentIndex = useFocusedInitialDetentIndex();

  return (
    <ReproScreen
      title="Repro Base"
      description="Hosts an auto-presenting sheet. Deep link to repro/modal or repro/page-sheet from a cold start — this sheet should present only after the modal is dismissed."
    >
      {sheetMounted && (
        <BlankSheet
          detents={['auto']}
          initialDetentIndex={initialDetentIndex}
          dismissible={false}
          dimmed={false}
        />
      )}
    </ReproScreen>
  );
}
