import { View, type ViewProps } from 'react-native';

import { GAP } from '../utils';

interface SpacerProps extends ViewProps {
  space?: number;
}

export const Spacer = (props: SpacerProps) => {
  const { space = GAP, style: $styleOverride, ...rest } = props;
  return <View style={[{ height: space }, $styleOverride]} {...rest} />;
};
