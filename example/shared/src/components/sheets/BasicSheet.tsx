import { forwardRef, useRef, useState, type Ref, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { BLUE, DARK, DARK_BLUE, FOOTER_HEIGHT, GAP, SPACING, times } from '../../utils';
import { DemoContent } from '../DemoContent';
import { Footer } from '../Footer';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { Spacer } from '../Spacer';
import { Header } from '../Header';

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

  const addContent = () => {
    setContentCount((prev) => prev + 1);
  };

  const removeContent = () => {
    setContentCount((prev) => Math.max(0, prev - 1));
  };

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  return (
    <TrueSheet
      detents={['auto', 0.8, 1]}
      name="basic"
      ref={sheetRef}
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
      {...rest}
    >
      {times(contentCount, (i) => (
        <DemoContent key={i} color={DARK_BLUE} />
      ))}
      <Button text={`Add Content (${contentCount})`} onPress={addContent} />
      {contentCount > 0 && <Button text="Remove Content" onPress={removeContent} />}
      <Spacer />
      <Button text="Present Large" onPress={() => resize(2)} />
      <Button text="Present 80%" onPress={() => resize(1)} />
      <Button text="Present Auto" onPress={() => resize(0)} />
      <Spacer />
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

      <TrueSheet
        ref={childSheet}
        name="basic-child"
        detents={['auto', 1]}
        backgroundColor={DARK}
        dimmed={false}
        style={styles.content}
        footer={<Footer />}
      >
        <DemoContent color={DARK_BLUE} />
        <DemoContent color={DARK_BLUE} />
        <DemoContent color={DARK_BLUE} />
        <Button text="Dismiss All" onPress={() => TrueSheet.dismissAll()} />
        <Button text="Dismiss Stack" onPress={() => TrueSheet.dismissStack('main')} />
        <Button text="Close" onPress={() => childSheet.current?.dismiss()} />
      </TrueSheet>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING,
    paddingTop: SPACING,
    paddingBottom: FOOTER_HEIGHT + SPACING,
    gap: GAP,
  },
});

BasicSheet.displayName = 'BasicSheet';
