import { forwardRef, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_GRAY, GAP, SPACING } from '../../utils';
import { DemoContent } from '../DemoContent';

interface SideRailSheetProps extends TrueSheetProps {}

const CLOSE_SIZE = 44;

export const SideRailSheet = forwardRef((props: SideRailSheetProps, ref: Ref<TrueSheet>) => {
  const { onCloseButtonVisibilityChange, ...rest } = props;
  const sheetRef = useRef<TrueSheet>(null);
  const [closeButtonVisible, setCloseButtonVisible] = useState(false);

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  const dismiss = () => sheetRef.current?.dismiss();

  return (
    <TrueSheet
      ref={sheetRef}
      detents={[0.5, 1]}
      backgroundColor={DARK}
      closeButton
      closeButtonOptions={{ icon: 'chevron.down' }}
      onCloseButtonPress={dismiss}
      header={
        // The side rail is a left or right safe-area inset of the sheet
        <SafeAreaView edges={['left', 'right']} style={styles.header}>
          <Text style={styles.title}>Side Rail</Text>
          {!closeButtonVisible && (
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              style={styles.close}
              onPress={dismiss}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          )}
        </SafeAreaView>
      }
      onCloseButtonVisibilityChange={(e) => {
        console.log('[SideRailSheet] close button', JSON.stringify(e.nativeEvent));
        setCloseButtonVisible(e.nativeEvent.visible);
        onCloseButtonVisibilityChange?.(e);
      }}
      {...rest}
    >
      <SafeAreaView edges={['left', 'right']} style={styles.content}>
        <Text style={styles.caption}>
          Close button: {closeButtonVisible ? 'in the side rail' : 'drawn by the app'}
        </Text>
        <DemoContent color={DARK_GRAY} />
        <DemoContent color={DARK_GRAY} />
      </SafeAreaView>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING,
    minHeight: CLOSE_SIZE + SPACING * 2,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  close: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    backgroundColor: DARK_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
  },
  content: {
    paddingHorizontal: SPACING,
    paddingBottom: SPACING,
    gap: GAP,
  },
  caption: {
    color: '#fff',
    opacity: 0.6,
  },
});

SideRailSheet.displayName = 'SideRailSheet';
