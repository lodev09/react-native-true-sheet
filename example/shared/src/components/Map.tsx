import { StyleSheet } from 'react-native';
import MapView, { type MapViewProps } from 'react-native-maps';

import { BLUE } from '../utils';

export const Map = (props: MapViewProps) => {
  const { style, ...rest } = props;

  return (
    <MapView
      style={[styles.map, style]}
      initialCamera={{
        altitude: 18000,
        zoom: 14,
        center: {
          latitude: 9.306743705457553,
          longitude: 123.30474002203727,
        },
        pitch: 0,
        heading: 0,
      }}
      userInterfaceStyle="dark"
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
