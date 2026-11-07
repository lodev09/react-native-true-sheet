import { forwardRef, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  TrueSheet,
  type TrueSheetProps,
  type VerticalBarChangeEventPayload,
} from '@lodev09/react-native-true-sheet';

import { DARK, DARK_GRAY, GAP, SPACING } from '../../utils';
import { DemoContent } from '../DemoContent';

interface SideRailSheetProps extends TrueSheetProps {}

const CLOSE_SIZE = 44;

export const SideRailSheet = forwardRef((props: SideRailSheetProps, ref: Ref<TrueSheet>) => {
  const { onVerticalBarChange, ...rest } = props;
  const sheetRef = useRef<TrueSheet>(null);
  const [bar, setBar] = useState<VerticalBarChangeEventPayload | null>(null);

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  const inRail = !!bar && bar.edge !== 'none';
  const railPadding = inRail
    ? bar.edge === 'trailing'
      ? { paddingEnd: SPACING + bar.inset }
      : { paddingStart: SPACING + bar.inset }
    : null;

  const closeButton = (
    <Pressable
      accessibilityLabel="Close"
      accessibilityRole="button"
      style={styles.close}
      onPress={() => sheetRef.current?.dismiss()}
    >
      <Text style={styles.closeText}>✕</Text>
    </Pressable>
  );

  return (
    <TrueSheet
      ref={sheetRef}
      detents={[0.5, 1]}
      backgroundColor={DARK}
      // The rail item can sit below the header, so keep the header above the content
      headerStyle={styles.headerLayer}
      header={
        <View style={[styles.header, railPadding]}>
          <Text style={styles.title}>Side Rail</Text>
          {!inRail && closeButton}
          {inRail && (
            <View style={[styles.rail, { start: bar.start, top: bar.top, width: bar.width }]}>
              {closeButton}
            </View>
          )}
        </View>
      }
      style={[styles.content, railPadding]}
      onVerticalBarChange={(e) => {
        console.log('[SideRailSheet] vertical bar', JSON.stringify(e.nativeEvent));
        setBar(e.nativeEvent);
        onVerticalBarChange?.(e);
      }}
      {...rest}
    >
      <Text style={styles.caption}>
        Vertical bar: {bar?.edge ?? 'none'}, inset {bar?.inset ?? 0}
      </Text>
      <DemoContent color={DARK_GRAY} />
      <DemoContent color={DARK_GRAY} />
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  headerLayer: {
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  rail: {
    position: 'absolute',
    alignItems: 'center',
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
