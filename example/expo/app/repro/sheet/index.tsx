import { BlankSheet } from '@example/shared/sheets';

import {
  ReproScreen,
  useDelayedMount,
  useFocusedInitialDetentIndex,
} from '../../../components/ReproScreen';

export default function ReproSheetBase() {
  const sheetMounted = useDelayedMount();
  const initialDetentIndex = useFocusedInitialDetentIndex();

  return (
    <ReproScreen
      title="Repro Sheet Navigator"
      description="Base screen with an auto-presenting sheet. Deep link to repro/sheet/details from a cold start — the details sheet should stack on top of this sheet."
    >
      {sheetMounted && (
        <BlankSheet
          detents={[0.5]}
          initialDetentIndex={initialDetentIndex}
          dismissible={false}
          dimmed={false}
        />
      )}
    </ReproScreen>
  );
}
