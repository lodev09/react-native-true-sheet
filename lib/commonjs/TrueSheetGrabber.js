"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TrueSheetGrabber = void 0;
var _reactNative = require("react-native");
var _jsxRuntime = require("react/jsx-runtime");
const GRABBER_DEFAULT_HEIGHT = 4;
const GRABBER_DEFAULT_WIDTH = 32;

// M3 spec: #49454F 0.4 alpha
const GRABBER_DEFAULT_COLOR = 'rgba(73,69,79,0.4)';
/**
 * Grabber component.
 * Used by defualt for Android but feel free to re-use.
 */
const TrueSheetGrabber = props => {
  const {
    visible = true,
    color = GRABBER_DEFAULT_COLOR,
    width = GRABBER_DEFAULT_WIDTH,
    height = GRABBER_DEFAULT_HEIGHT,
    topOffset = 0,
    style
  } = props;
  if (!visible) return null;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
    style: [$wrapper, style, {
      height: GRABBER_DEFAULT_HEIGHT * 4,
      top: topOffset
    }],
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
      style: [$grabber, {
        height,
        width,
        backgroundColor: color
      }]
    })
  });
};
exports.TrueSheetGrabber = TrueSheetGrabber;
const $wrapper = {
  position: 'absolute',
  alignSelf: 'center',
  paddingHorizontal: 12,
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
};
const $grabber = {
  borderRadius: GRABBER_DEFAULT_HEIGHT / 2
};
//# sourceMappingURL=TrueSheetGrabber.js.map