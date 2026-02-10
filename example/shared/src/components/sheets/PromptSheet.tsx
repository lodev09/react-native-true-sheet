import { forwardRef, useRef, type Ref, useImperativeHandle } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, FOOTER_HEIGHT, GAP, SPACING } from '../../utils';
import { Input } from '../Input';
import { Button } from '../Button';
import { Header } from '../Header';
import { Spacer } from '../Spacer';
import { Footer } from '../Footer';

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
  const input10Ref = useRef<TextInput>(null);
  const textAreaRef = useRef<TextInput>(null);

  const handleDismiss = () => {
    console.log('Sheet prompt dismissed!');
  };

  const handleDismissPress = async () => {
    await sheetRef.current?.dismiss();
    console.log('Sheet prompt dismiss asynced');
  };

  const handleSubmitPress = async () => {
    await sheetRef.current?.dismiss();
  };

  useImperativeHandle<TrueSheet | null, TrueSheet | null>(ref, () => sheetRef.current);

  return (
    <TrueSheet
      ref={sheetRef}
      name="prompt-sheet"
      detents={[1]}
      scrollable
      scrollableOptions={{ keyboardScrollOffset: FOOTER_HEIGHT + SPACING }}
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
      footer={<Footer />}
      {...props}
    >
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        scrollIndicatorInsets={{ bottom: FOOTER_HEIGHT }}
      >
        <Input
          ref={input1Ref}
          placeholder="First name"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => input2Ref.current?.focus()}
        />
        <Input
          ref={input2Ref}
          placeholder="Last name"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => input3Ref.current?.focus()}
        />
        <Input
          ref={input3Ref}
          placeholder="Email"
          keyboardType="email-address"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => input4Ref.current?.focus()}
        />
        <Input
          ref={input4Ref}
          placeholder="Phone"
          keyboardType="phone-pad"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => input5Ref.current?.focus()}
        />
        <Input
          ref={input5Ref}
          placeholder="Address"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => input6Ref.current?.focus()}
        />
        <Input
          ref={input6Ref}
          placeholder="City"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => input7Ref.current?.focus()}
        />
        <Input
          ref={input7Ref}
          placeholder="State"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => input8Ref.current?.focus()}
        />
        <Input
          ref={input8Ref}
          placeholder="Zip code"
          keyboardType="number-pad"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => input9Ref.current?.focus()}
        />
        <Input
          ref={input9Ref}
          placeholder="Country"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => input10Ref.current?.focus()}
        />
        <Input
          ref={input10Ref}
          placeholder="Contact"
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => textAreaRef.current?.focus()}
        />
        <Input ref={textAreaRef} placeholder="Message..." multiline />
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
    paddingBottom: FOOTER_HEIGHT + SPACING,
    gap: GAP,
  },
});

PromptSheet.displayName = 'PromptSheet';
