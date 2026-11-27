import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';

import { Button, Footer } from '@example/shared/components';
import { DARK, DARK_GRAY, SPACING } from '@example/shared/utils';

import { ReproScreen, useFocusedInitialDetentIndex } from '../../components/ReproScreen';

export default function ReproFooterAccessibility() {
  const initialDetentIndex = useFocusedInitialDetentIndex();
  const [taps, setTaps] = useState(0);

  return (
    <ReproScreen
      title="Repro Footer Accessibility"
      description="A dimmed sheet with a footer. With VoiceOver on (or in the accessibility tree), only the sheet's content and footer should be reachable, not the button behind it."
    >
      <Button text={`Behind the sheet (${taps})`} onPress={() => setTaps((count) => count + 1)} />
      <TrueSheet
        detents={[0.3]}
        initialDetentIndex={initialDetentIndex}
        dismissible={false}
        backgroundColor={DARK}
        style={styles.content}
        footer={<Footer text="FOOTER BUTTON" onPress={() => console.log('Footer pressed')} />}
        footerStyle={styles.footer}
      >
        <Text style={styles.text}>Dimmed sheet with a footer</Text>
      </TrueSheet>
    </ReproScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingTop: SPACING * 2,
  },
  footer: {
    backgroundColor: DARK_GRAY,
  },
  text: {
    color: '#fff',
  },
});
