import { StyleSheet } from 'react-native';

import { Text, type TextProps } from './Themed';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, styles.mono]} />;
}

const styles = StyleSheet.create({
  mono: {
    fontFamily: 'SpaceMono',
  },
});
