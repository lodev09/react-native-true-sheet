import { forwardRef, useEffect, useRef, useState, type Ref, useImperativeHandle } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  ZoomIn,
  ZoomOut,
  type ComplexAnimationBuilder,
  type WithSpringConfig,
} from 'react-native-reanimated';
import {
  TrueSheet,
  TrueSheetOverlay,
  TrueSheetPeek,
  useTrueSheet,
  type TrueSheetProps,
} from '@lodev09/react-native-true-sheet';

import { BLUE, DARK, DARK_BLUE, DARK_GRAY, GAP, LIGHT_GRAY, SPACING, times } from '../../utils';
import { DemoContent } from '../DemoContent';
import { Footer } from '../Footer';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { Spacer } from '../Spacer';
import { Header } from '../Header';
import { Input } from '../Input';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG: WithSpringConfig = {
  damping: 500,
  stiffness: 1000,
  mass: 3,
  overshootClamping: true,
};

const spring = <T extends ComplexAnimationBuilder<any>>(animation: T) =>
  animation
    .springify()
    .damping(SPRING_CONFIG.damping!)
    .stiffness(SPRING_CONFIG.stiffness!)
    .mass(SPRING_CONFIG.mass!)
    .overshootClamping(SPRING_CONFIG.overshootClamping ? 1 : 0);

interface BasicSheetProps extends TrueSheetProps {
  onNavigateToModal?: () => void;
  onNavigateToTest?: () => void;
}

export const BasicSheet = forwardRef((props: BasicSheetProps, ref: Ref<TrueSheet>) => {
  const { onNavigateToModal, onNavigateToTest, ...rest } = props;
  const sheetRef = useRef<TrueSheet>(null);
  const childSheet = useRef<TrueSheet>(null);
  const [contentCount, setContentCount] = useState(0);
  const [detentIndex, setDetentIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { dismissAll, dismissStack } = useTrueSheet();

  const resize = async (index: number) => {
    await sheetRef.current?.resize(index);
    console.log(`Basic sheet resize to ${index} async`);
  };

  const dismiss = async () => {
    await sheetRef.current?.dismiss();
    console.log('Basic sheet dismiss asynced');
  };

  const presentChild = async () => {
    await childSheet.current?.present();
    console.log('Child sheet presented!');
  };

  const presentPromptSheet = async () => {
    await sheetRef.current?.dismiss();
    await TrueSheet.present('prompt-sheet');
  };

  const showToast = () => {
    setToast('Rendered above the sheet!');
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => () => clearTimeout(toastTimeout.current), []);

  const addContent = () => {
    setContentCount((prev) => prev + 1);
  };

  const removeContent = () => {
    setContentCount((prev) => Math.max(0, prev - 1));
  };

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  return (
    <TrueSheet
      detents={['peek', 'auto', 1]}
      name="basic"
      ref={sheetRef}
      detached
      presentation="form"
      grabberOptions={{
        width: 60,
      }}
      style={styles.content}
      onDragChange={(e) =>
        console.log(
          `drag changed at index: ${e.nativeEvent.index}, position: ${e.nativeEvent.position}`
        )
      }
      onDragBegin={(e) =>
        console.log(
          `drag began at index: ${e.nativeEvent.index}, position: ${e.nativeEvent.position}`
        )
      }
      onWillBlur={() => {
        console.log('Basic sheet will blur');
      }}
      onDidBlur={() => {
        console.log('Basic sheet blurred');
      }}
      onDragEnd={(e) =>
        console.log(
          `drag ended at index: ${e.nativeEvent.index}, position: ${e.nativeEvent.position}`
        )
      }
      onDidDismiss={() => console.log('Basic sheet dismissed!')}
      onDidPresent={(e) =>
        console.log(
          `Basic sheet presented at index: ${e.nativeEvent.index}, position: ${e.nativeEvent.position}`
        )
      }
      onDetentChange={(e) => {
        setDetentIndex(e.nativeEvent.index);
        console.log(
          `Detent changed to index:`,
          e.nativeEvent.index,
          'position:',
          e.nativeEvent.position
        );
      }}
      onMount={() => {
        console.log('BasicSheet is ready!');
      }}
      backgroundBlur={detentIndex > 0 ? 'system-material' : undefined}
      backgroundColor={detentIndex > 0 ? BLUE : undefined}
      header={<Header />}
      footer={<Footer />}
      footerStyle={styles.footer}
      {...rest}
    >
      {times(contentCount, (i) => (
        <DemoContent key={i} color={DARK_BLUE} />
      ))}
      <Button text={`Add Content (${contentCount})`} onPress={addContent} />
      {contentCount > 0 && <Button text="Remove Content" onPress={removeContent} />}
      <ButtonGroup>
        <Button text="Peek" onPress={() => resize(0)} />
        <Button text="Auto" onPress={() => resize(1)} />
        <Button text="Large" onPress={() => resize(2)} />
      </ButtonGroup>
      <ButtonGroup>
        <Button text="Show Toast" onPress={showToast} />
        <Button text="Show Dialog" onPress={() => setDialogVisible(true)} />
      </ButtonGroup>
      <TrueSheetPeek />
      <Spacer />
      <Input />
      <ButtonGroup>
        <Button text="Child Sheet" onPress={presentChild} />
        <Button text="PromptSheet" onPress={presentPromptSheet} />
      </ButtonGroup>
      <ButtonGroup>
        {onNavigateToModal && <Button text="Modal" onPress={onNavigateToModal} />}
        {onNavigateToTest && <Button text="Test Screen" onPress={onNavigateToTest} />}
      </ButtonGroup>
      <Button
        text="Dismiss Stack (does nothing)"
        onPress={() => sheetRef.current?.dismissStack()}
      />
      <Spacer />
      <Button text="Dismiss" onPress={dismiss} />

      {/* Touches outside the toast pass through — the sheet stays interactive */}
      <TrueSheetOverlay style={styles.toastOverlay}>
        {toast && (
          <Animated.View
            style={styles.toast}
            entering={spring(new FadeInDown())}
            exiting={spring(new FadeOutUp())}
          >
            <Text style={styles.overlayText}>{toast}</Text>
          </Animated.View>
        )}
      </TrueSheetOverlay>

      {/* A full-size backdrop blocks the sheet until the dialog is dismissed */}
      <TrueSheetOverlay>
        {dialogVisible && (
          <AnimatedPressable
            style={styles.backdrop}
            entering={spring(new FadeIn())}
            exiting={spring(new FadeOut())}
            onPress={() => setDialogVisible(false)}
          >
            <Animated.View
              style={styles.dialog}
              entering={spring(new ZoomIn())}
              exiting={spring(new ZoomOut())}
            >
              <Text style={styles.overlayText}>Rendered above the sheet!</Text>
              <Button text="Close" onPress={() => setDialogVisible(false)} />
            </Animated.View>
          </AnimatedPressable>
        )}
      </TrueSheetOverlay>

      <TrueSheet
        ref={childSheet}
        name="basic-child"
        detents={['auto', 1]}
        backgroundColor={DARK}
        style={styles.childContent}
        footer={<Footer />}
        footerStyle={styles.footer}
      >
        <DemoContent color={DARK_BLUE} />
        {onNavigateToModal && <Button text="Modal" onPress={onNavigateToModal} />}
        <Button text="Dismiss All" onPress={() => dismissAll()} />
        <Button text="Dismiss Stack" onPress={() => dismissStack('main')} />
        <Button text="Close" onPress={() => childSheet.current?.dismiss()} />
      </TrueSheet>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  footer: {
    backgroundColor: DARK_GRAY,
  },
  content: {
    paddingHorizontal: SPACING,
    paddingBottom: SPACING,
    gap: GAP,
  },
  childContent: {
    padding: SPACING,
    gap: GAP,
  },
  toastOverlay: {
    alignItems: 'center',
    paddingTop: SPACING * 4,
  },
  toast: {
    backgroundColor: DARK,
    borderRadius: SPACING,
    paddingHorizontal: SPACING,
    paddingVertical: SPACING / 2,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: SPACING,
  },
  dialog: {
    backgroundColor: DARK,
    borderRadius: SPACING,
    padding: SPACING,
    gap: GAP,
  },
  overlayText: {
    color: LIGHT_GRAY,
    textAlign: 'center',
  },
});

BasicSheet.displayName = 'BasicSheet';
