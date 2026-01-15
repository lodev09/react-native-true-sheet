import { forwardRef, useRef, type Ref, useImperativeHandle } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, GAP, SPACING } from '../../utils';
import { Input } from '../Input';
import { Button } from '../Button';
import { Header } from '../Header';
import { Spacer } from '../Spacer';

interface PromptSheetProps extends TrueSheetProps {}

export const PromptSheet = forwardRef((props: PromptSheetProps, ref: Ref<TrueSheet>) => {

  const sheetRef = useRef<TrueSheet>(null);
  const input1Ref = useRef<TextInput>(null);
  const input2Ref = useRef<TextInput>(null);
  const input3Ref = useRef<TextInput>(null);
  const input4Ref = useRef<TextInput>(null);
  const input5Ref = useRef<TextInput>(null);
  const input6Ref = useRef<TextInput>(null);
  const input7Ref = useRef<TextInput>(null);
  const input8Ref = useRef<TextInput>(null);
  const input9Ref = useRef<TextInput>(null);
  const textAreaRef = useRef<TextInput>(null);

  const inputRefs = [
    input1Ref,
    input2Ref,
    input3Ref,
    input4Ref,
    input5Ref,
    input6Ref,
    input7Ref,
    input8Ref,
    input9Ref,
    textAreaRef,
  ];

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
      detents={[1]}
      scrollable
      scrollableOptions={{ keyboardScrollOffset: SPACING }}
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
      header={<Header />}
      {...props}
    >
      <ScrollView nestedScrollEnabled contentContainerStyle={styles.content}>
        <Input ref={input1Ref} placeholder="First name" />
        <Input ref={input2Ref} placeholder="Last name" />
        <Input ref={input3Ref} placeholder="Email" keyboardType="email-address" />
        <Input ref={input4Ref} placeholder="Phone" keyboardType="phone-pad" />
        <Input ref={input5Ref} placeholder="Address" />
        <Input ref={input6Ref} placeholder="City" />
        <Input ref={input7Ref} placeholder="State" />
        <Input ref={input8Ref} placeholder="Zip code" keyboardType="number-pad" />
        <Input ref={input9Ref} placeholder="Country" />
        <Input ref={textAreaRef} placeholder="Message..." multiline />
        <Input ref={input9Ref} placeholder="Contact" />
        <Spacer />
        <Button text="Submit" onPress={handleSubmitPress} />
        <Button text="Dismiss" onPress={handleDismissPress} />
      </ScrollView>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    gap: GAP,
  },
});

PromptSheet.displayName = 'PromptSheet';
