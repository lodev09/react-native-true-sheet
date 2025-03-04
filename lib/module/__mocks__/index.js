"use strict";

import React from 'react';
import { View } from 'react-native';
import { jsx as _jsx } from "react/jsx-runtime";
export * from "../TrueSheetGrabber.js";
export * from "../TrueSheetFooter.js";
export class TrueSheet extends React.Component {
  static dismiss = jest.fn();
  static present = jest.fn();
  static resize = jest.fn();
  dismiss = jest.fn();
  present = jest.fn();
  resize = jest.fn();
  render() {
    return /*#__PURE__*/_jsx(View, {
      ...this.props
    });
  }
}
//# sourceMappingURL=index.js.map