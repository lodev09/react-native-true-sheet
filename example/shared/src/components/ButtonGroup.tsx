import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { GAP } from '../utils';

interface ButtonGroupProps {
  children: ReactNode;
}

export const ButtonGroup = ({ children }: ButtonGroupProps) => {
  return (
    <View style={styles.container}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={styles.item}>
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: GAP,
  },
  item: {
    flex: 1,
  },
});
