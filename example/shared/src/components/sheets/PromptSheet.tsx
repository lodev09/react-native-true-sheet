import { forwardRef, useRef, type Ref, useImperativeHandle } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, FOOTER_HEIGHT, GAP, SPACING } from '../../utils';
import { Input } from '../Input';
import { Button } from '../Button';
import { Footer } from '../Footer';
import { Header } from '../Header';

interface PromptSheetProps extends TrueSheetProps {}

export const PromptSheet = forwardRef((props: PromptSheetProps, ref: Ref<TrueSheet>) => {
  const sheetRef = useRef<TrueSheet>(null);
  const input1Ref = useRef<TextInput>(null);
  const input2Ref = useRef<TextInput>(null);
  const textAreaRef = useRef<TextInput>(null);

  const inputRefs = [input1Ref, input2Ref, textAreaRef];

  const handleDismiss = () => {
    console.log('Sheet prompt dismissed!');
  };

  const handleDismissPress = async () => {
    await sheetRef.current?.dismiss();
    console.log('Sheet prompt dismiss asynced');
  };

  const handleSubmitPress = () => {
    const currentIndex = inputRefs.findIndex((r) => r.current?.isFocused());
    if (currentIndex >= 0 && currentIndex < inputRefs.length - 1) {
      inputRefs[currentIndex + 1]?.current?.focus();
    }
  };

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  return (
    <TrueSheet
      ref={sheetRef}
      name="prompt-sheet"
      detents={['auto']}
      style={styles.sheet}
      backgroundBlur="dark"
      backgroundColor={DARK}
      onDidDismiss={handleDismiss}
      onDidPresent={(e) => {
        console.log(
          `Sheet prompt presented at index: ${e.nativeEvent.index}, position: ${e.nativeEvent.position}`
        );
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
      header={<Header />}
      scrollable
      {...props}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Input ref={input1Ref} placeholder="Full name" />
        <Input ref={input2Ref} placeholder="Email" keyboardType="email-address" />
        <Input ref={textAreaRef} placeholder="Message..." multiline />
        <Button text="Submit" onPress={handleSubmitPress} />
        <Button text="Dismiss" onPress={handleDismissPress} />
      </ScrollView>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  sheet: {
    padding: SPACING,
  },
  content: {
    paddingBottom: FOOTER_HEIGHT + SPACING,
    gap: GAP,
  },
});

PromptSheet.displayName = 'PromptSheet';
