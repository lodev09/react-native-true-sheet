import { StyleSheet, View, type ViewProps } from 'react-native';

import { BLUE } from '../utils';

export const Map = (props: ViewProps) => {
  const { style, ...rest } = props;

  return <View style={[styles.map, style]} {...rest} />;
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: BLUE,
  },
});
