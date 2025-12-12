import { forwardRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, SPACING } from '../../utils';

interface BlankSheetProps extends TrueSheetProps {}

export const BlankSheet = forwardRef<TrueSheet, BlankSheetProps>((props, ref) => {
  return (
    <TrueSheet
      ref={ref}
      detents={[0.5, 1]}
      blurTint="dark"
      backgroundColor={DARK}

      style={styles.content}
      {...props}
    >
      <Text style={styles.text}>Blank Sheet</Text>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingTop: SPACING * 2,
  },
  text: {
    color: '#fff',
  },
});

BlankSheet.displayName = 'BlankSheet';
