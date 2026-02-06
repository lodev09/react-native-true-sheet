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

import { Platform, StyleSheet, findNodeHandle, processColor } from 'react-native';

const LINKING_ERROR =
  `The package '@lodev09/react-native-true-sheet' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n' +
  '- You are using the new architecture (Fabric)\n';

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

  /**
   * Tracks if a present operation is in progress
   */
  private isPresenting: boolean = false;

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
   * Dismiss only the sheets presented on top of a sheet by given `name`
   * @param name - Sheet name
   * @param animated - Whether to animate the dismissal (default: true)
   * @returns Promise that resolves when all child sheets are dismissed
   * @throws Error if sheet not found
   */
  public static async dismissStack(name: string, animated: boolean = true): Promise<void> {
    const instance = TrueSheet.getInstance(name);
    if (!instance) {
      throw new Error(`Sheet with name "${name}" not found`);
    }

    return instance.dismissStack(animated);
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

  /**
   * Dismiss all presented sheets by dismissing from the bottom of the stack.
   * This ensures child sheets are dismissed first before their parent.
   * @param animated - Whether to animate the dismissals (default: true)
   * @returns Promise that resolves when all sheets are dismissed
   */
  public static async dismissAll(animated: boolean = true): Promise<void> {
    return TrueSheetModule?.dismissAll(animated);
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
    // Clean up native view after dismiss for lazy loading.
    // Skip unmount if a present is in progress to avoid race condition.
    if (!this.isPresenting) {
      this.setState({ shouldRenderNativeView: false });
    }

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
   * Present the sheet at a given detent index.
   * @param index - The detent index to present at (default: 0)
   * @param animated - Whether to animate the presentation (default: true)
   */
  public async present(index: number = 0, animated: boolean = true): Promise<void> {
    const detentsLength = Math.min(this.props.detents?.length ?? 2, 3); // Max 3 detents
    if (index < 0 || index >= detentsLength) {
      throw new Error(
        `TrueSheet: present index (${index}) is out of bounds. detents array has ${detentsLength} item(s)`
      );
    }

    this.isPresenting = true;

    // Lazy load: render native view if not already rendered
    if (!this.state.shouldRenderNativeView) {
      await new Promise<void>((resolve) => {
        this.presentationResolver = resolve;
        this.setState({ shouldRenderNativeView: true });
      });
    }

    await TrueSheetModule?.presentByRef(this.handle, index, animated);
    this.isPresenting = false;
  }

  /**
   * Resize the sheet to a given detent index.
   * @param index - The detent index to resize to
   */
  public async resize(index: number): Promise<void> {
    await TrueSheetModule?.resizeByRef(this.handle, index);
  }

  /**
   * Dismiss this sheet and all sheets presented on top of it in a single animation.
   * @param animated - Whether to animate the dismissal (default: true)
   */
  public async dismiss(animated: boolean = true): Promise<void> {
    return TrueSheetModule?.dismissByRef(this.handle, animated);
  }

  /**
   * Dismiss only the sheets presented on top of this sheet, keeping this sheet presented.
   * If no sheets are presented on top, this method does nothing.
   * @param animated - Whether to animate the dismissal (default: true)
   */
  public async dismissStack(animated: boolean = true): Promise<void> {
    return TrueSheetModule?.dismissStackByRef(this.handle, animated);
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
      dimmedDetentIndex,
      backgroundBlur,
      blurOptions,
      cornerRadius,
      maxContentHeight,
      maxContentWidth,
      anchor = 'center',
      anchorOffset,
      scrollable = false,
      scrollableOptions,
      pageSizing = true,
      children,
      style,
      header,
      headerStyle,
      footer,
      footerStyle,
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

    return (
      <TrueSheetViewNativeComponent
        {...rest}
        ref={this.nativeRef}
        style={[StyleSheet.absoluteFill, styles.sheetView]}
        detents={resolvedDetents}
        backgroundBlur={backgroundBlur}
        blurOptions={blurOptions}
        backgroundColor={backgroundColor}
        cornerRadius={cornerRadius}
        grabber={grabber}
        grabberOptions={{
          ...grabberOptions,
          color: processColor(grabberOptions?.color),
        }}
        dimmed={dimmed}
        dimmedDetentIndex={dimmedDetentIndex}
        initialDetentIndex={initialDetentIndex}
        initialDetentAnimated={initialDetentAnimated}
        dismissible={dismissible}
        draggable={draggable}
        maxContentHeight={maxContentHeight}
        maxContentWidth={maxContentWidth}
        anchor={anchor}
        anchorOffset={anchorOffset}
        scrollable={scrollable}
        scrollableOptions={scrollableOptions}
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
          <TrueSheetContainerViewNativeComponent style={scrollable && StyleSheet.absoluteFill}>
            {header && (
              <TrueSheetHeaderViewNativeComponent style={[styles.header, headerStyle]}>
                {isValidElement(header) ? header : createElement(header)}
              </TrueSheetHeaderViewNativeComponent>
            )}
            <TrueSheetContentViewNativeComponent
              style={[style, scrollable && styles.scrollableContent]}
            >
              {children}
            </TrueSheetContentViewNativeComponent>
            {footer && (
              <TrueSheetFooterViewNativeComponent style={[styles.footer, footerStyle]}>
                {isValidElement(footer) ? footer : createElement(footer)}
              </TrueSheetFooterViewNativeComponent>
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
    pointerEvents: 'box-none',
  },
  scrollableContent: {
    flex: 1,
  },
  header: {
    pointerEvents: 'box-none',
  },
  footer: {
    pointerEvents: 'box-none',
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
