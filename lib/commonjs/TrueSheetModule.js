"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TrueSheetModule = void 0;
var _reactNative = require("react-native");
const LINKING_ERROR = `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` + _reactNative.Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';

// NativeModules automatically resolves 'TrueSheetView' to 'TrueSheetViewModule'
const TrueSheetModule = exports.TrueSheetModule = _reactNative.NativeModules.TrueSheetView ? _reactNative.NativeModules.TrueSheetView : new Proxy({}, {
  get() {
    throw new Error(LINKING_ERROR);
  }
});
//# sourceMappingURL=TrueSheetModule.js.map