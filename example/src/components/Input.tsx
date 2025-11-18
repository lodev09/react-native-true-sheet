import { StyleSheet, TextInput, View } from 'react-native';

import { BORDER_RADIUS, GRAY, INPUT_HEIGHT, SPACING } from '../utils';

export const Input = () => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter some text..."
        placeholderTextColor={GRAY}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: SPACING,
    height: INPUT_HEIGHT,
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    marginBottom: SPACING,
  },
  input: {
    fontSize: 16,
    height: INPUT_HEIGHT,
  },
});
