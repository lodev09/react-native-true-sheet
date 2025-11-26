import { Platform, StyleSheet, TextInput, View } from 'react-native';

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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: SPACING,
    height: INPUT_HEIGHT,
    borderRadius: Platform.select({ ios: BORDER_RADIUS * 6, android: BORDER_RADIUS * 3 }),
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    height: INPUT_HEIGHT,
  },
});
