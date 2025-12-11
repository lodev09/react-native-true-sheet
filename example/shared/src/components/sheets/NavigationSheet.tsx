import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import type { TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { Button } from '../Button';
import { GAP, SPACING } from '../../utils';

interface NavigationSheetProps extends TrueSheetProps {
  onOpenModal?: () => void;
}

export const NavigationSheet = forwardRef<TrueSheet, NavigationSheetProps>((props, ref) => {
  const { onOpenModal, ...rest } = props;

  return (
    <TrueSheet ref={ref} detents={['auto']} dimmed={false} {...rest}>
      <View style={styles.container}>
        <Text style={styles.title}>Navigation Sheet</Text>
        <Text style={styles.description}>
          This sheet demonstrates opening a fullScreenModal from within a TrueSheet.
        </Text>
        {onOpenModal && <Button text="Open Full Screen Modal" onPress={onOpenModal} />}
      </View>
    </TrueSheet>
  );
});

NavigationSheet.displayName = 'NavigationSheet';

const styles = StyleSheet.create({
  container: {
    padding: SPACING * 2,
    gap: GAP,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SPACING / 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: SPACING,
  },
});
