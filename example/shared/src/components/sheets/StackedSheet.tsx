import { forwardRef, useRef, useState, type Ref, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_BLUE, DARK_GRAY, GAP, LIGHT_GRAY, SPACING } from '../../utils';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { DemoContent } from '../DemoContent';
import { Footer } from '../Footer';
import { Header } from '../Header';
import { Text } from '../Text';

/**
 * Repro for https://github.com/lodev09/react-native-true-sheet/issues/816 (web).
 *
 * 1. Present the parent, then a child (non-dimmed by default).
 * 2. Press anywhere inside the child: header, footer, inert text, or a button.
 *    - Bug 1: the parent logs `dismissed` and slides away.
 *    - Bug 2: "Back" pops the child but it snaps back and blinks out
 *      instead of animating.
 * 3. Toggle "dimmed" on the child to compare with a modal layer.
 */
export const StackedSheet = forwardRef((props: TrueSheetProps, ref: Ref<TrueSheet>) => {
  const parentSheet = useRef<TrueSheet>(null);
  const childSheet = useRef<TrueSheet>(null);
  const [childDimmed, setChildDimmed] = useState(false);
  const [pressLog, setPressLog] = useState<string[]>([]);

  const log = (message: string) => {
    console.log(`[StackedSheet] ${message}`);
    setPressLog((prev) => [message, ...prev].slice(0, 5));
  };

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => parentSheet.current);

  // The child is a React *sibling* of the parent, like sheets rendered by a
  // navigator. Nesting it inside the parent hides the bug: React bubbles the
  // child's pointerdown through the parent's Radix layer, which then treats
  // the press as "inside".
  return (
    <>
      <TrueSheet
        ref={parentSheet}
        name="stacked-parent"
        detents={['auto', 1]}
        style={styles.content}
        onDidPresent={() => log('parent presented')}
        onWillDismiss={() => log('parent will dismiss')}
        onDidDismiss={() => log('parent dismissed')}
        {...props}
      >
        <Text style={styles.title}>Parent (#816)</Text>
        <Text style={styles.description}>
          Present the child, then press anything inside it. The parent must stay open.
        </Text>
        <ButtonGroup>
          <Button
            text="Child"
            hint={childDimmed ? 'dimmed' : 'not dimmed'}
            onPress={() => childSheet.current?.present()}
          />
          <Button text="Toggle Child Dimmed" onPress={() => setChildDimmed((prev) => !prev)} />
        </ButtonGroup>
        <View style={styles.log}>
          {pressLog.map((line, i) => (
            <Text key={i} style={styles.logText}>
              {line}
            </Text>
          ))}
        </View>
        <Button text="Dismiss Parent" onPress={() => parentSheet.current?.dismiss()} />
      </TrueSheet>

      <TrueSheet
        ref={childSheet}
        name="stacked-child"
        detents={['auto', 1]}
        dimmed={childDimmed}
        backgroundColor={DARK}
        style={styles.content}
        header={
          <Header style={styles.header}>
            <Button text="Back" onPress={() => childSheet.current?.dismiss()} />
            <Button text="Back (pressIn)" onPressIn={() => childSheet.current?.dismiss()} />
          </Header>
        }
        footer={<Footer onPress={() => log('child footer pressed')} />}
        footerStyle={styles.footer}
        onDidPresent={() => log('child presented')}
        onDidDismiss={() => log('child dismissed')}
      >
        <Text style={[styles.title, styles.light]}>Child</Text>
        <Text style={[styles.description, styles.light]}>
          Inert text: press here. Then try the header, footer, and buttons.
        </Text>
        <DemoContent color={DARK_BLUE} />
        <Button text="Log Press" onPress={() => log('child button pressed')} />
      </TrueSheet>
    </>
  );
});

StackedSheet.displayName = 'StackedSheet';

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    gap: GAP,
  },
  header: {
    flexDirection: 'row',
    gap: GAP,
    height: undefined,
  },
  footer: {
    backgroundColor: DARK_GRAY,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    opacity: 0.6,
  },
  light: {
    color: LIGHT_GRAY,
  },
  log: {
    minHeight: SPACING * 6,
    gap: 2,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
});
