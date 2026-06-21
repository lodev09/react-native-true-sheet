import { forwardRef, useRef, type Ref, useImperativeHandle } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrueSheet, type TrueSheetProps } from '@lodev09/react-native-true-sheet';

import { DARK, BUTTON_HEIGHT as FOOTER_HEIGHT, GAP, SPACING } from '../../utils';
import { Input } from '../Input';
import { Button } from '../Button';
import { Header } from '../Header';

interface PromptSheetProps extends TrueSheetProps {}

export const PromptSheet = forwardRef((props: PromptSheetProps, ref: Ref<TrueSheet>) => {
  const { bottom } = useSafeAreaInsets();

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
      detents={[0.75, 1]}
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
      }}
      header={<Header />}
      footer={
        <View style={[styles.footer, { paddingBottom: bottom + GAP }]}>
          <Button style={styles.button} text="Dismiss" onPress={handleDismissPress} />
          <Button style={styles.button} text="Submit" onPress={handleSubmitPress} />
        </View>
      }
      footerOptions={{ keyboardOffset: -bottom }}
      {...props}
    >
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: FOOTER_HEIGHT + GAP + SPACING }]}
        scrollIndicatorInsets={{ bottom: FOOTER_HEIGHT + GAP }}
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
      </ScrollView>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: SPACING,
    gap: GAP,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING,
    gap: GAP,
  },
  button: {
    flex: 1,
  },
});

PromptSheet.displayName = 'PromptSheet';
