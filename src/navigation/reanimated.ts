import { ReanimatedTrueSheetScreen } from './screen/ReanimatedTrueSheetScreen';
import { registerReanimatedScreen } from './screen/reanimatedScreen';

/**
 * Enables the `reanimated` screen option of the sheet navigators. Import it once, before the
 * navigator renders (e.g. at the top of the root layout): a screen rendered before the import uses
 * the plain screen, and switches to the reanimated one, remounting, on its next render. Apps that
 * don't import it don't bundle react-native-reanimated for the navigator.
 *
 * @example
 * ```tsx
 * import '@lodev09/react-native-true-sheet/navigation/reanimated';
 * ```
 */
registerReanimatedScreen(ReanimatedTrueSheetScreen);
