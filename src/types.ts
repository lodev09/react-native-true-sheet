import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

export interface SheetifyViewProps extends ViewProps {
  contentContainerStyle?: StyleProp<ViewStyle>
}
