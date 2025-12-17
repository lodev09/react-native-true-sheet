import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { LIGHT_GRAY, INPUT_HEIGHT, SPACING } from '../utils';

export const Input = (props: TextInputProps) => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter some text..."
        placeholderTextColor={LIGHT_GRAY}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: SPACING,
    height: INPUT_HEIGHT,
    borderRadius: INPUT_HEIGHT,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    height: INPUT_HEIGHT,
    color: 'white',
  },
});
