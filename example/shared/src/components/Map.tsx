import { StyleSheet } from 'react-native';
import { MapView, type MapViewProps } from '@lugg/maps';

import { BLUE } from '../utils';

export const Map = (props: Omit<MapViewProps, 'style'> & { style?: MapViewProps['style'] }) => {
  const { style, ...rest } = props;

  return (
    <MapView
      style={[styles.map, style]}
      initialCoordinate={{
        latitude: 9.306743705457553,
        longitude: 123.30474002203727,
      }}
      initialZoom={14}
      provider="google"
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: BLUE,
  },
});
