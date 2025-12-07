import {
  PureComponent,
  type RefObject,
  createRef,
  type ReactNode,
  type ComponentRef,
  isValidElement,
  createElement,
} from 'react';

import type {
  TrueSheetProps,
  DragBeginEvent,
  DragChangeEvent,
  DragEndEvent,
  DetentChangeEvent,
  WillPresentEvent,
  DidPresentEvent,
  PositionChangeEvent,
  DidDismissEvent,
  WillDismissEvent,
  MountEvent,
  WillFocusEvent,
  DidFocusEvent,
  WillBlurEvent,
  DidBlurEvent,
  BackPressEvent,
} from './TrueSheet.types';
import TrueSheetViewNativeComponent from './fabric/TrueSheetViewNativeComponent';
import TrueSheetContainerViewNativeComponent from './fabric/TrueSheetContainerViewNativeComponent';
import TrueSheetContentViewNativeComponent from './fabric/TrueSheetContentViewNativeComponent';
import TrueSheetHeaderViewNativeComponent from './fabric/TrueSheetHeaderViewNativeComponent';
import TrueSheetFooterViewNativeComponent from './fabric/TrueSheetFooterViewNativeComponent';

import TrueSheetModule from './specs/NativeTrueSheetModule';

import { Platform, processColor, StyleSheet, findNodeHandle, View } from 'react-native';

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n' +
  '- You are using the new architecture (Fabric)\n';

// Material Design 3 minimum touch target
const ANDROID_HITBOX_HEIGHT = 48;

if (!TrueSheetModule) {
  throw new Error(LINKING_ERROR);
}

type NativeRef = ComponentRef<typeof TrueSheetViewNativeComponent>;

interface TrueSheetState {
  shouldRenderNativeView: boolean;
}

export class TrueSheet extends PureComponent<TrueSheetProps, TrueSheetState> {
  displayName = 'TrueSheet';

  private readonly nativeRef: RefObject<NativeRef | null>;

  /**
   * Map of sheet names against their instances.
   */
  private static readonly instances: { [name: string]: TrueSheet } = {};

  /**
   * Resolver to be called when mount event is received
   */
  private presentationResolver: (() => void) | null = null;

  constructor(props: TrueSheetProps) {
    super(props);

    this.nativeRef = createRef<NativeRef>();

    this.validateDetents();

    // Lazy load by default, except when initialDetentIndex is set (for auto-presentation)
    const shouldRenderImmediately =
      props.initialDetentIndex !== undefined && props.initialDetentIndex >= 0;

    this.state = {
      shouldRenderNativeView: shouldRenderImmediately,
    };

    this.onMount = this.onMount.bind(this);
    this.onWillDismiss = this.onWillDismiss.bind(this);
    this.onDidDismiss = this.onDidDismiss.bind(this);
    this.onWillPresent = this.onWillPresent.bind(this);
    this.onDidPresent = this.onDidPresent.bind(this);
    this.onDetentChange = this.onDetentChange.bind(this);
    this.onDragBegin = this.onDragBegin.bind(this);
    this.onDragChange = this.onDragChange.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onPositionChange = this.onPositionChange.bind(this);
    this.onWillFocus = this.onWillFocus.bind(this);
    this.onDidFocus = this.onDidFocus.bind(this);
    this.onWillBlur = this.onWillBlur.bind(this);
    this.onDidBlur = this.onDidBlur.bind(this);
    this.onBackPress = this.onBackPress.bind(this);
  }

  private validateDetents(): void {
    const { detents, initialDetentIndex } = this.props;

    // Warn if detents length exceeds 3
    if (detents && detents.length > 3) {
      console.warn(
        `TrueSheet: detents array has ${detents.length} items but maximum is 3. Only the first 3 will be used.`
      );
    }

    // Warn for invalid detent fractions
    if (detents) {
      detents.forEach((detent, index) => {
        if (detent !== 'auto' && typeof detent === 'number') {
          if (detent <= 0 || detent > 1) {
            console.warn(
              `TrueSheet: detent at index ${index} (${detent}) should be between 0 and 1. It will be clamped.`
            );
          }
        }
      });
    }

    // Validate initialDetentIndex bounds
    if (initialDetentIndex !== undefined && initialDetentIndex >= 0) {
      const detentsLength = Math.min(detents?.length ?? 2, 3); // Max 3 detents
      if (initialDetentIndex >= detentsLength) {
        throw new Error(
          `TrueSheet: initialDetentIndex (${initialDetentIndex}) is out of bounds. detents array has ${detentsLength} item(s)`
        );
      }
    }
  }

  private static getInstance(name: string) {
    const instance = TrueSheet.instances[name];
    if (!instance) {
      console.warn(`Could not find TrueSheet instance with name "${name}". Check your name prop.`);
      return;
    }

    return instance;
  }

  private get handle(): number {
    const nodeHandle = findNodeHandle(this.nativeRef.current);
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error('Could not get native view tag');
    }

    return nodeHandle;
  }

  /**
   * Present the sheet by given `name` (Promise-based)
   * @param name - Sheet name (must match sheet's name prop)
   * @param index - Detent index (default: 0)
   * @param animated - Whether to animate the presentation (default: true)
   * @returns Promise that resolves when sheet is fully presented
   * @throws Error if sheet not found or presentation fails
   */
  public static async present(
    name: string,
    index: number = 0,
    animated: boolean = true
  ): Promise<void> {
    const instance = TrueSheet.getInstance(name);
    if (!instance) {
      throw new Error(`Sheet with name "${name}" not found`);
    }

    return instance.present(index, animated);
  }

  /**
   * Dismiss the sheet by given `name` (Promise-based)
   * @param name - Sheet name
   * @param animated - Whether to animate the dismissal (default: true)
   * @returns Promise that resolves when sheet is fully dismissed
   * @throws Error if sheet not found or dismissal fails
   */
  public static async dismiss(name: string, animated: boolean = true): Promise<void> {
    const instance = TrueSheet.getInstance(name);
    if (!instance) {
      throw new Error(`Sheet with name "${name}" not found`);
    }

    return instance.dismiss(animated);
  }

  /**
   * Resize the sheet by given `name` (Promise-based)
   * @param name - Sheet name
   * @param index - New detent index
   * @returns Promise that resolves when resize is complete
   * @throws Error if sheet not found
   */
  public static async resize(name: string, index: number): Promise<void> {
    const instance = TrueSheet.getInstance(name);
    if (!instance) {
      throw new Error(`Sheet with name "${name}" not found`);
    }

    return instance.resize(index);
  }

  private registerInstance(): void {
    if (this.props.name) {
      TrueSheet.instances[this.props.name] = this;
    }
  }

  private unregisterInstance(): void {
    if (this.props.name) {
      delete TrueSheet.instances[this.props.name];
    }
  }

  private onDetentChange(event: DetentChangeEvent): void {
    this.props.onDetentChange?.(event);
  }

  private onWillPresent(event: WillPresentEvent): void {
    this.props.onWillPresent?.(event);
  }

  private onDidPresent(event: DidPresentEvent): void {
    this.props.onDidPresent?.(event);
  }

  private onWillDismiss(event: WillDismissEvent): void {
    this.props.onWillDismiss?.(event);
  }

  private onDidDismiss(event: DidDismissEvent): void {
    // Clean up native view after dismiss for lazy loading
    this.setState({ shouldRenderNativeView: false });
    this.props.onDidDismiss?.(event);
  }

  private onMount(event: MountEvent): void {
    // Resolve the mount promise if waiting
    if (this.presentationResolver) {
      this.presentationResolver();
      this.presentationResolver = null;
    }

    this.props.onMount?.(event);
  }

  private onDragBegin(event: DragBeginEvent): void {
    this.props.onDragBegin?.(event);
  }

  private onDragChange(event: DragChangeEvent): void {
    this.props.onDragChange?.(event);
  }

  private onDragEnd(event: DragEndEvent): void {
    this.props.onDragEnd?.(event);
  }

  private onPositionChange(event: PositionChangeEvent): void {
    this.props.onPositionChange?.(event);
  }

  private onWillFocus(event: WillFocusEvent): void {
    this.props.onWillFocus?.(event);
  }

  private onDidFocus(event: DidFocusEvent): void {
    this.props.onDidFocus?.(event);
  }

  private onWillBlur(event: WillBlurEvent): void {
    this.props.onWillBlur?.(event);
  }

  private onDidBlur(event: DidBlurEvent): void {
    this.props.onDidBlur?.(event);
  }

  private onBackPress(event: BackPressEvent): void {
    this.props.onBackPress?.(event);
  }

  /**
   * Present the Sheet by `index` (Promise-based)
   * @param index - Detent index (default: 0)
   * @param animated - Whether to animate the presentation (default: true)
   */
  public async present(index: number = 0, animated: boolean = true): Promise<void> {
    const detentsLength = Math.min(this.props.detents?.length ?? 2, 3); // Max 3 detents
    if (index < 0 || index >= detentsLength) {
      throw new Error(
        `TrueSheet: present index (${index}) is out of bounds. detents array has ${detentsLength} item(s)`
      );
    }

    // Lazy load: render native view if not already rendered
    if (!this.state.shouldRenderNativeView) {
      await new Promise<void>((resolve) => {
        this.presentationResolver = resolve;
        this.setState({ shouldRenderNativeView: true });
      });
    }

    return TrueSheetModule?.presentByRef(this.handle, index, animated);
  }

  /**
   * Resizes the Sheet programmatically by `index`.
   * This is an alias of the `present(index)` method.
   */
  public async resize(index: number): Promise<void> {
    await this.present(index);
  }

  /**
   * Dismisses the Sheet
   * @param animated - Whether to animate the dismissal (default: true)
   */
  public async dismiss(animated: boolean = true): Promise<void> {
    return TrueSheetModule?.dismissByRef(this.handle, animated);
  }

  componentDidMount(): void {
    this.registerInstance();
  }

  componentDidUpdate(prevProps: TrueSheetProps): void {
    this.registerInstance();

    // Validate when detents prop changes
    if (prevProps.detents !== this.props.detents) {
      this.validateDetents();
    }
  }

  componentWillUnmount(): void {
    this.unregisterInstance();

    // Clean up presentation resolver
    this.presentationResolver = null;
  }

  render(): ReactNode {
    const {
      detents = [0.5, 1],
      backgroundColor,
      dismissible = true,
      draggable = true,
      grabber = true,
      grabberOptions,
      dimmed = true,
      initialDetentIndex = -1,
      initialDetentAnimated = true,
      keyboardMode = 'resize',
      dimmedDetentIndex,
      blurTint,
      blurOptions,
      cornerRadius,
      maxHeight,
      edgeToEdgeFullScreen,
      scrollable = false,
      pageSizing = true,
      children,
      style,
      header,
      footer,
      insetAdjustment = 'automatic',
      ...rest
    } = this.props;

    // Trim to max 3 detents and clamp fractions
    const resolvedDetents = detents.slice(0, 3).map((detent) => {
      if (detent === 'auto' || detent === -1) return -1;

      // Default to 0.1 if zero or below
      if (detent <= 0) return 0.1;

      // Clamp to maximum of 1
      return Math.min(1, detent);
    });

    const containerStyle =
      this.props.scrollable &&
      Platform.select({
        android: styles.scrollableAndroidContainer,
      });

    const contentStyle =
      this.props.scrollable &&
      Platform.select({
        android: styles.scrollableAndroidContent,
      });

    return (
      <TrueSheetViewNativeComponent
        {...rest}
        ref={this.nativeRef}
        style={styles.sheetView}
        detents={resolvedDetents}
        blurTint={blurTint}
        blurOptions={blurOptions}
        background={(processColor(backgroundColor) as number) ?? 0}
        cornerRadius={cornerRadius}
        grabber={grabber}
        grabberOptions={{
          ...grabberOptions,
          color: (processColor(grabberOptions?.color) as number) ?? 0,
        }}
        dimmed={dimmed}
        dimmedDetentIndex={dimmedDetentIndex}
        keyboardMode={keyboardMode}
        initialDetentIndex={initialDetentIndex}
        initialDetentAnimated={initialDetentAnimated}
        dismissible={dismissible}
        draggable={draggable}
        maxHeight={maxHeight}
        edgeToEdgeFullScreen={edgeToEdgeFullScreen}
        scrollable={scrollable}
        pageSizing={pageSizing}
        insetAdjustment={insetAdjustment}
        onMount={this.onMount}
        onWillPresent={this.onWillPresent}
        onDidPresent={this.onDidPresent}
        onWillDismiss={this.onWillDismiss}
        onDidDismiss={this.onDidDismiss}
        onDetentChange={this.onDetentChange}
        onDragBegin={this.onDragBegin}
        onDragChange={this.onDragChange}
        onDragEnd={this.onDragEnd}
        onPositionChange={this.onPositionChange}
        onWillFocus={this.onWillFocus}
        onDidFocus={this.onDidFocus}
        onWillBlur={this.onWillBlur}
        onDidBlur={this.onDidBlur}
        onBackPress={this.onBackPress}
      >
        {this.state.shouldRenderNativeView && (
          <TrueSheetContainerViewNativeComponent style={containerStyle}>
            {header && (
              <TrueSheetHeaderViewNativeComponent>
                {isValidElement(header) ? header : createElement(header)}
              </TrueSheetHeaderViewNativeComponent>
            )}
            <TrueSheetContentViewNativeComponent style={[style, contentStyle]}>
              {children}
            </TrueSheetContentViewNativeComponent>
            {footer && (
              <TrueSheetFooterViewNativeComponent style={styles.footer}>
                {isValidElement(footer) ? footer : createElement(footer)}
              </TrueSheetFooterViewNativeComponent>
            )}
            {Platform.OS === 'android' && grabber && draggable && (
              <View collapsable={false} style={styles.grabberHitbox} />
            )}
          </TrueSheetContainerViewNativeComponent>
        )}
      </TrueSheetViewNativeComponent>
    );
  }
}

const styles = StyleSheet.create({
  sheetView: {
    zIndex: -9999,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,

    // Android needs a fixed bottom to avoid jumping content
    bottom: Platform.select({ android: 0 }),
  },
  scrollableAndroidContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollableAndroidContent: {
    flexGrow: 1,
    flexBasis: 0,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  grabberHitbox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ANDROID_HITBOX_HEIGHT,
  },
});
