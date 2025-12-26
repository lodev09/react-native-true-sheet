import { forwardRef, useRef, type Ref, useImperativeHandle, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, DARK_BLUE, FOOTER_HEIGHT, GAP, SPACING } from '../../utils';
import { DemoContent } from '../DemoContent';
import { Input } from '../Input';
import { Button } from '../Button';
import { Footer } from '../Footer';

interface PromptSheetProps extends TrueSheetProps {}

export const PromptSheet = forwardRef((props: PromptSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null);
  const inputRef = useRef<TextInput>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleDismiss = () => {
    setIsSubmitted(false);
    console.log('Sheet prompt dismissed!');
  };

  const dismiss = async () => {
    await sheetRef.current?.dismiss();
    console.log('Sheet prompt dismiss asynced');
  };

  const submit = async () => {
    setIsSubmitted(true);
  };

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  return (
    <TrueSheet
      ref={sheetRef}
      dismissible={false}
      grabber={false}
      name="prompt-sheet"
      detents={['auto']}
      style={styles.content}
      backgroundBlur="dark"
      backgroundColor={DARK}
      onDidDismiss={handleDismiss}
      onDidPresent={(e) => {
        console.log(
          `Sheet prompt presented at index: ${e.nativeEvent.index}, position: ${e.nativeEvent.position}`
        );

        inputRef.current?.focus();
      }}
      onDetentChange={(e) =>
        console.log(
          `Detent changed to index:`,
          e.nativeEvent.index,
          'position:',
          e.nativeEvent.position
        )
      }
      onBackPress={() => {
        console.log('Back button pressed!');
        sheetRef.current?.dismiss();
      }}
      footer={<Footer onPress={() => console.log('footer pressed')} />}
      {...props}
    >
      <DemoContent color={DARK_BLUE} />
      <Input ref={inputRef} />
      {isSubmitted && <Input />}
      <Button text="Submit" onPress={submit} />
      <Button text="Dismiss" onPress={dismiss} />
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    paddingTop: SPACING * 2,
    paddingBottom: FOOTER_HEIGHT + SPACING,
    gap: GAP,
  },
});

PromptSheet.displayName = 'PromptSheet';
