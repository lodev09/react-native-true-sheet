import { NativeModules, Platform } from 'react-native'

const LINKING_ERROR =
  `The package '@lodev09/react-native-sheetify' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

export const SheetifyModule = NativeModules.SheetifyViewManager
  ? NativeModules.SheetifyViewManager
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      }
    )
