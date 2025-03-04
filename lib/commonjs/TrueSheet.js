"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TrueSheet = void 0;
var _react = require("react");
var _reactNative = require("react-native");
var _TrueSheetModule = require("./TrueSheetModule.js");
var _TrueSheetGrabber = require("./TrueSheetGrabber.js");
var _TrueSheetFooter = require("./TrueSheetFooter.js");
var _jsxRuntime = require("react/jsx-runtime");
const NATIVE_COMPONENT_NAME = 'TrueSheetView';
const LINKING_ERROR = `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` + _reactNative.Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';
const TrueSheetNativeView = (0, _reactNative.requireNativeComponent)(NATIVE_COMPONENT_NAME);
if (!TrueSheetNativeView) {
  throw new Error(LINKING_ERROR);
}
class TrueSheet extends _react.PureComponent {
  displayName = 'TrueSheet';
  /**
   * Map of sheet names against their handle.
   */
  static handles = {};
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
  static getHandle(name) {
    const handle = TrueSheet.handles[name];
    if (!handle) {
      console.warn(`Could not get native view tag from "${name}". Check your name prop.`);
      return;
    }
    return handle;
  }

  /**
   * Present the sheet by given `name`.
   * See `name` prop.
   */
  static async present(name, index = 0) {
    const handle = TrueSheet.getHandle(name);
    if (!handle) return;
    await _TrueSheetModule.TrueSheetModule.present(handle, index);
  }

  /**
   * Dismiss the sheet by given `name`.
   * See `name` prop.
   */
  static async dismiss(name) {
    const handle = TrueSheet.getHandle(name);
    if (!handle) return;
    await _TrueSheetModule.TrueSheetModule.dismiss(handle);
  }

  /**
   * Resize the sheet by given `name`.
   * See `name` prop.
   */
  static async resize(name, index) {
    await TrueSheet.present(name, index);
  }
  get handle() {
    const nodeHandle = (0, _reactNative.findNodeHandle)(this.ref.current);
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error('Could not get native view tag');
    }
    return nodeHandle;
  }
  updateState() {
    const scrollableHandle = this.props.scrollRef?.current ? (0, _reactNative.findNodeHandle)(this.props.scrollRef.current) : null;
    if (this.props.name) {
      TrueSheet.handles[this.props.name] = this.handle;
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
    await _TrueSheetModule.TrueSheetModule.present(this.handle, index);
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
    await _TrueSheetModule.TrueSheetModule.dismiss(this.handle);
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
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(TrueSheetNativeView, {
      ref: this.ref,
      style: $nativeSheet,
      scrollableHandle: this.state.scrollableHandle,
      sizes: sizes,
      blurTint: blurTint,
      background: (0, _reactNative.processColor)(backgroundColor),
      cornerRadius: cornerRadius,
      contentHeight: this.state.contentHeight,
      footerHeight: this.state.footerHeight,
      grabber: grabber,
      dimmed: dimmed,
      dimmedIndex: dimmedIndex,
      edgeToEdge: edgeToEdge,
      initialIndex: initialIndex,
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