import NativeTrueSheetModule from './NativeTrueSheetModule'
import { Platform } from 'react-native'

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n' +
  '- You are using the new architecture (Fabric)\n'

if (!NativeTrueSheetModule) {
  throw new Error(LINKING_ERROR)
}

export const TrueSheetModule = NativeTrueSheetModule
