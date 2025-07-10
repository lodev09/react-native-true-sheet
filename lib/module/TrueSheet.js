"use strict";

import { createRef, PureComponent } from 'react';
import { findNodeHandle, Platform, processColor, requireNativeComponent, View } from 'react-native';
import { TrueSheetModule } from "./TrueSheetModule.js";
import { TrueSheetGrabber } from "./TrueSheetGrabber.js";
import { TrueSheetFooter } from "./TrueSheetFooter.js";
import { TrueSheetHeader } from "./TrueSheetHeader.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const NATIVE_COMPONENT_NAME = 'TrueSheetView';
const LINKING_ERROR = `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` + Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';
const TrueSheetNativeView = requireNativeComponent(NATIVE_COMPONENT_NAME);
if (!TrueSheetNativeView) {
  throw new Error(LINKING_ERROR);
}
export class TrueSheet extends PureComponent {
  displayName = 'TrueSheet';
  /**
   * Map of sheet names against their handle.
   */
  static handles = {};
  constructor(props) {
    super(props);
    this.ref = /*#__PURE__*/createRef();
    this.onMount = this.onMount.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onPresent = this.onPresent.bind(this);
    this.onSizeChange = this.onSizeChange.bind(this);
    this.onDragBegin = this.onDragBegin.bind(this);
    this.onDragChange = this.onDragChange.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onContentLayout = this.onContentLayout.bind(this);
    this.onHeaderLayout = this.onHeaderLayout.bind(this);
    this.onFooterLayout = this.onFooterLayout.bind(this);
    this.onContainerSizeChange = this.onContainerSizeChange.bind(this);
    this.state = {
      containerWidth: undefined,
      containerHeight: undefined,
      contentHeight: undefined,
      headerHeight: undefined,
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
    await TrueSheetModule.present(handle, index);
  }

  /**
   * Dismiss the sheet by given `name`.
   * See `name` prop.
   */
  static async dismiss(name) {
    const handle = TrueSheet.getHandle(name);
    if (!handle) return;
    await TrueSheetModule.dismiss(handle);
  }

  /**
   * Resize the sheet by given `name`.
   * See `name` prop.
   */
  static async resize(name, index) {
    await TrueSheet.present(name, index);
  }
  get handle() {
    const nodeHandle = findNodeHandle(this.ref.current);
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error('Could not get native view tag');
    }
    return nodeHandle;
  }
  updateState() {
    const scrollableHandle = this.props.scrollRef?.current ? findNodeHandle(this.props.scrollRef.current) : null;
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
  onHeaderLayout(event) {
    this.setState({
      headerHeight: event.nativeEvent.layout.height
    });
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
    await TrueSheetModule.present(this.handle, index);
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
    await TrueSheetModule.dismiss(this.handle);
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
      HeaderComponent,
      FooterComponent,
      style,
      contentContainerStyle,
      children,
      ...rest
    } = this.props;
    return /*#__PURE__*/_jsx(TrueSheetNativeView, {
      ref: this.ref,
      style: $nativeSheet,
      scrollableHandle: this.state.scrollableHandle,
      sizes: sizes,
      blurTint: blurTint,
      background: processColor(backgroundColor),
      cornerRadius: cornerRadius,
      contentHeight: this.state.contentHeight,
      headerHeight: this.state.headerHeight,
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
      children: /*#__PURE__*/_jsxs(View, {
        collapsable: false,
        style: [$contentContainer, {
          // The native side communicates the available drawing area
          // via containerWidth/containerHeight properties. We set them
          // here and let the React layout engine handle the rest.
          width: this.state.containerWidth,
          height: this.state.containerHeight
        }, {
          backgroundColor: Platform.select({
            ios: undefined,
            android: backgroundColor
          }),
          borderTopLeftRadius: Platform.select({
            ios: undefined,
            android: cornerRadius
          }),
          borderTopRightRadius: Platform.select({
            ios: undefined,
            android: cornerRadius
          })
        }, contentContainerStyle],
        ...rest,
        children: [/*#__PURE__*/_jsx(View, {
          collapsable: false,
          onLayout: this.onHeaderLayout,
          children: /*#__PURE__*/_jsx(TrueSheetHeader, {
            Component: HeaderComponent
          })
        }), /*#__PURE__*/_jsx(View, {
          collapsable: false,
          onLayout: this.onContentLayout,
          style: [$growableContent, style],
          children: children
        }), /*#__PURE__*/_jsx(View, {
          collapsable: false,
          onLayout: this.onFooterLayout,
          children: /*#__PURE__*/_jsx(TrueSheetFooter, {
            Component: FooterComponent
          })
        }), Platform.OS === 'android' && /*#__PURE__*/_jsx(TrueSheetGrabber, {
          visible: grabber,
          ...grabberProps
        })]
      })
    });
  }
}
const $contentContainer = {
  position: 'absolute',
  left: 0,
  top: 0
};
const $growableContent = {
  flexGrow: 1,
  flexShrink: 1
};
const $nativeSheet = {
  position: 'absolute',
  width: '100%',
  left: -9999,
  zIndex: -9999
};
//# sourceMappingURL=TrueSheet.js.map