import { NativeModules, Platform } from 'react-native'

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

export const TrueSheetModule = NativeModules.TrueSheetViewManager
  ? NativeModules.TrueSheetViewManager
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      }
    )
