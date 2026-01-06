import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { LIGHT_GRAY, INPUT_HEIGHT, SPACING } from '../utils';
import { forwardRef } from 'react';

const MULTILINE_HEIGHT = 100;

export const Input = forwardRef<TextInput, TextInputProps>((props, ref) => {
  const { multiline, style, ...rest } = props;

  return (
    <View style={[styles.inputContainer, multiline && styles.multilineContainer]}>
      <TextInput
        ref={ref}
        style={[styles.input, multiline && styles.multilineInput, style]}
        placeholder="Enter some text..."
        placeholderTextColor={LIGHT_GRAY}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'auto'}
        {...rest}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: SPACING,
    height: INPUT_HEIGHT,
    borderRadius: INPUT_HEIGHT,
    justifyContent: 'center',
  },
  multilineContainer: {
    height: MULTILINE_HEIGHT,
    borderRadius: SPACING,
    paddingVertical: SPACING,
  },
  input: {
    fontSize: 16,
    height: INPUT_HEIGHT,
    color: 'white',
  },
  multilineInput: {
    height: MULTILINE_HEIGHT - SPACING * 2,
  },
});
