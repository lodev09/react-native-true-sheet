import type { TextStyle } from 'react-native'
import type { WithSpringConfig } from 'react-native-reanimated'

export const SPACING = 16
export const INPUT_HEIGHT = SPACING * 3
export const FOOTER_HEIGHT = SPACING * 6
export const BORDER_RADIUS = 4
export const GRABBER_COLOR = 'rgba(121, 135, 160, 0.5)'

export const DARK = '#282e37'
export const GRAY = '#b2bac8'
export const DARK_GRAY = '#333b48'
export const LIGHT_GRAY = '#ebedf1'
export const BLUE = '#3784d7'
export const DARK_BLUE = '#1f64ae'

export const $WHITE_TEXT: TextStyle = { color: 'white' }

export const SPRING_CONFIG: WithSpringConfig = {
  damping: 500,
  stiffness: 1000,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 10,
  restSpeedThreshold: 10,
}
