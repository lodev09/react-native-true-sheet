"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TrueSheet = void 0;
var _react = require("react");
var _reactNative = require("react-native");
var _TrueSheetViewNativeComponent = _interopRequireWildcard(require("./TrueSheetViewNativeComponent"));
var _TrueSheetGrabber = require("./TrueSheetGrabber.js");
var _TrueSheetFooter = require("./TrueSheetFooter.js");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const LINKING_ERROR = `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` + _reactNative.Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n' + '- You are using the new architecture (Fabric)\n';

// Validate that Commands are available
if (!_TrueSheetViewNativeComponent.Commands) {
  throw new Error(LINKING_ERROR);
}

// Lazy load TurboModule to avoid initialization errors
let TrueSheetModule = null;
const getTurboModule = () => {
  if (TrueSheetModule === null) {
    try {
      const {
        default: module
      } = require('./specs/NativeTrueSheetModule');
      TrueSheetModule = module;
    } catch (error) {
      console.warn('[TrueSheet] TurboModule not available:', error);
      TrueSheetModule = undefined;
    }
  }
  return TrueSheetModule;
};
class TrueSheet extends _react.PureComponent {
  displayName = 'TrueSheet';
  /**
   * Map of sheet names against their ref.
   */
  static refs = {};
  constructor(props) {
    super(props);
    this.ref = /*#__PURE__*/(0, _react.createRef)();
    this.onMount = this.onMount.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onPresent = this.onPresent.bind(this);
    this.onSizeChange = this.onSizeChange.bind(this);
    this.onDragBegin = this.onDragBegin.bind(this);
    this.onDragChange = this.onDragChange.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onContentLayout = this.onContentLayout.bind(this);
    this.onFooterLayout = this.onFooterLayout.bind(this);
    this.onContainerSizeChange = this.onContainerSizeChange.bind(this);
    this.state = {
      containerWidth: undefined,
      containerHeight: undefined,
      contentHeight: undefined,
      footerHeight: undefined,
      scrollableHandle: null
    };
  }
  static getRef(name) {
    const ref = TrueSheet.refs[name];
    if (!ref) {
      console.warn(`Could not get sheet ref from "${name}". Check your name prop.`);
      return;
    }
    return ref;
  }

  /**
   * Present the sheet by given `name` (Promise-based)
   * @param name - Sheet name (must match sheet's name prop)
   * @param index - Size index (default: 0)
   * @returns Promise that resolves when sheet is fully presented
   * @throws Error if sheet not found or presentation fails
   */
  static async present(name, index = 0) {
    const ref = TrueSheet.getRef(name);
    if (!ref) {
      throw new Error(`Sheet with name "${name}" not found`);
    }
    const viewTag = ref._nativeTag;
    if (!viewTag) {
      throw new Error(`Could not get native tag for sheet "${name}"`);
    }
    const module = getTurboModule();
    if (!module) {
      throw new Error('TurboModule not available. Make sure new architecture is enabled.');
    }
    return module.presentByRef(viewTag, index);
  }

  /**
   * Dismiss the sheet by given `name` (Promise-based)
   * @param name - Sheet name
   * @returns Promise that resolves when sheet is fully dismissed
   * @throws Error if sheet not found or dismissal fails
   */
  static async dismiss(name) {
    const ref = TrueSheet.getRef(name);
    if (!ref) {
      throw new Error(`Sheet with name "${name}" not found`);
    }
    const viewTag = ref._nativeTag;
    if (!viewTag) {
      throw new Error(`Could not get native tag for sheet "${name}"`);
    }
    const module = getTurboModule();
    if (!module) {
      throw new Error('TurboModule not available. Make sure new architecture is enabled.');
    }
    return module.dismissByRef(viewTag);
  }

  /**
   * Resize the sheet by given `name` (Promise-based)
   * @param name - Sheet name
   * @param index - New size index
   * @returns Promise that resolves when resize is complete
   * @throws Error if sheet not found
   */
  static async resize(name, index) {
    const ref = TrueSheet.getRef(name);
    if (!ref) {
      throw new Error(`Sheet with name "${name}" not found`);
    }
    const viewTag = ref._nativeTag;
    if (!viewTag) {
      throw new Error(`Could not get native tag for sheet "${name}"`);
    }
    const module = getTurboModule();
    if (!module) {
      throw new Error('TurboModule not available. Make sure new architecture is enabled.');
    }
    return module.resizeByRef(viewTag, index);
  }
  updateState() {
    const scrollableHandle = this.props.scrollRef?.current ? this.props.scrollRef.current._nativeTag || null : null;
    if (this.props.name && this.ref.current) {
      TrueSheet.refs[this.props.name] = this.ref.current;
    }
    this.setState({
      scrollableHandle
    });
  }
  onSizeChange(event) {
    this.props.onSizeChange?.(event);
  }
  onContainerSizeChange(event) {
    this.setState({
      containerWidth: event.nativeEvent.width,
      containerHeight: event.nativeEvent.height
    });
  }
  onPresent(event) {
    this.props.onPresent?.(event);
  }
  onFooterLayout(event) {
    this.setState({
      footerHeight: event.nativeEvent.layout.height
    });
  }
  onContentLayout(event) {
    this.setState({
      contentHeight: event.nativeEvent.layout.height
    });
  }
  onDismiss() {
    this.props.onDismiss?.();
  }
  onMount() {
    this.props.onMount?.();
  }
  onDragBegin(event) {
    this.props.onDragBegin?.(event);
  }
  onDragChange(event) {
    this.props.onDragChange?.(event);
  }
  onDragEnd(event) {
    this.props.onDragEnd?.(event);
  }

  /**
   * Present the sheet. Optionally accepts a size `index`.
   * See `sizes` prop
   */
  async present(index = 0) {
    if (this.ref.current) {
      _TrueSheetViewNativeComponent.Commands.present(this.ref.current, index);
    }
  }

  /**
   * Resizes the Sheet programmatically by `index`.
   * This is an alias of the `present(index)` method.
   */
  async resize(index) {
    await this.present(index);
  }

  /**
   * Dismisses the Sheet
   */
  async dismiss() {
    if (this.ref.current) {
      _TrueSheetViewNativeComponent.Commands.dismiss(this.ref.current);
    }
  }
  componentDidMount() {
    if (this.props.sizes && this.props.sizes.length > 3) {
      console.warn('TrueSheet only supports a maximum of 3 sizes; collapsed, half-expanded and expanded. Check your `sizes` prop.');
    }
    this.updateState();
  }
  componentDidUpdate() {
    this.updateState();
  }
  render() {
    const {
      sizes = ['medium', 'large'],
      backgroundColor = 'white',
      dismissible = true,
      grabber = true,
      dimmed = true,
      initialIndexAnimated = true,
      edgeToEdge = false,
      keyboardMode = 'resize',
      initialIndex,
      dimmedIndex,
      grabberProps,
      blurTint,
      cornerRadius,
      maxHeight,
      FooterComponent,
      style,
      contentContainerStyle,
      children,
      ...rest
    } = this.props;
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_TrueSheetViewNativeComponent.default, {
      ref: this.ref,
      style: $nativeSheet,
      scrollableHandle: this.state.scrollableHandle ?? 0,
      sizes: sizes.map(String),
      blurTint: blurTint,
      background: (0, _reactNative.processColor)(backgroundColor) ?? 0,
      cornerRadius: cornerRadius,
      contentHeight: this.state.contentHeight ?? 0,
      footerHeight: this.state.footerHeight ?? 0,
      grabber: grabber,
      dimmed: dimmed,
      dimmedIndex: dimmedIndex,
      edgeToEdge: edgeToEdge,
      initialIndex: initialIndex ?? -1,
      initialIndexAnimated: initialIndexAnimated,
      keyboardMode: keyboardMode,
      dismissible: dismissible,
      maxHeight: maxHeight,
      onMount: this.onMount,
      onPresent: this.onPresent,
      onDismiss: this.onDismiss,
      onSizeChange: this.onSizeChange,
      onDragBegin: this.onDragBegin,
      onDragChange: this.onDragChange,
      onDragEnd: this.onDragEnd,
      onContainerSizeChange: this.onContainerSizeChange,
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_reactNative.View, {
        collapsable: false,
        style: [{
          overflow: _reactNative.Platform.select({
            ios: undefined,
            android: 'hidden'
          }),
          // Update the width on JS side.
          // New Arch interop does not support updating it in native :/
          width: this.state.containerWidth,
          height: this.state.containerHeight
        }, style],
        ...rest,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          collapsable: false,
          onLayout: this.onContentLayout,
          style: contentContainerStyle,
          children: children
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.View, {
          collapsable: false,
          onLayout: this.onFooterLayout,
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_TrueSheetFooter.TrueSheetFooter, {
            Component: FooterComponent
          })
        }), _reactNative.Platform.OS === 'android' && /*#__PURE__*/(0, _jsxRuntime.jsx)(_TrueSheetGrabber.TrueSheetGrabber, {
          visible: grabber,
          ...grabberProps
        })]
      })
    });
  }
}
exports.TrueSheet = TrueSheet;
const $nativeSheet = {
  position: 'absolute',
  width: '100%',
  left: -9999,
  zIndex: -9999
};
//# sourceMappingURL=TrueSheet.js.map