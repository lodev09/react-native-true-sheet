import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { GAP } from '../utils';

interface ButtonGroupProps {
  children: ReactNode;
}

export const ButtonGroup = ({ children }: ButtonGroupProps) => {
  return (
    <View style={styles.container}>
      {Children.map(children, (child) => (
        <View style={styles.item}>{child}</View>
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
