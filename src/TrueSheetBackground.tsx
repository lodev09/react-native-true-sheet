import { StyleSheet, View } from 'react-native';
import type { TrueSheetProps } from './TrueSheet.types';

export const TrueSheetBackground = ({
  background,
  backgroundStyle,
}: Pick<TrueSheetProps, 'background' | 'backgroundStyle'>) => (
  <View
    pointerEvents="none"
    style={[
      StyleSheet.absoluteFill,
      { backgroundColor: StyleSheet.flatten(backgroundStyle)?.backgroundColor },
    ]}
  >
    {background}
  </View>
);
