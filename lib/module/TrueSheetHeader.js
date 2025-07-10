"use strict";

import { jsx as _jsx } from "react/jsx-runtime";
export const TrueSheetHeader = props => {
  const {
    Component
  } = props;
  if (!Component) return null;
  if (typeof Component !== 'function') {
    return Component;
  }
  return /*#__PURE__*/_jsx(Component, {});
};
//# sourceMappingURL=TrueSheetHeader.js.map