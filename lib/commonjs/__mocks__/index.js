"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  TrueSheet: true
};
exports.TrueSheet = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _jsxRuntime = require("react/jsx-runtime");
var _TrueSheetGrabber = require("../TrueSheetGrabber.js");
Object.keys(_TrueSheetGrabber).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _TrueSheetGrabber[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _TrueSheetGrabber[key];
    }
  });
});
var _TrueSheetFooter = require("../TrueSheetFooter.js");
Object.keys(_TrueSheetFooter).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _TrueSheetFooter[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _TrueSheetFooter[key];
    }
  });
});
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class TrueSheet extends _react.default.Component {
  static dismiss = jest.fn();
  static present = jest.fn();
  static resize = jest.fn();
  dismiss = jest.fn();
  present = jest.fn();
  resize = jest.fn();
  render() {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
      ...this.props
    });
  }
}
exports.TrueSheet = TrueSheet;
//# sourceMappingURL=index.js.map