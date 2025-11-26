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
} from './TrueSheet.types';
import TrueSheetViewNativeComponent from './fabric/TrueSheetViewNativeComponent';
import TrueSheetContainerViewNativeComponent from './fabric/TrueSheetContainerViewNativeComponent';
import TrueSheetContentViewNativeComponent from './fabric/TrueSheetContentViewNativeComponent';
import TrueSheetHeaderViewNativeComponent from './fabric/TrueSheetHeaderViewNativeComponent';
import TrueSheetFooterViewNativeComponent from './fabric/TrueSheetFooterViewNativeComponent';

import TrueSheetModule from './specs/NativeTrueSheetModule';

import { Platform, processColor, StyleSheet, findNodeHandle } from 'react-native';

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
   * @returns Promise that resolves when sheet is fully presented
   * @throws Error if sheet not found or presentation fails
   */
  public static async present(name: string, index: number = 0): Promise<void> {
    const instance = TrueSheet.getInstance(name);
    if (!instance) {
      throw new Error(`Sheet with name "${name}" not found`);
    }

    return instance.present(index);
  }

  /**
   * Dismiss the sheet by given `name` (Promise-based)
   * @param name - Sheet name
   * @returns Promise that resolves when sheet is fully dismissed
   * @throws Error if sheet not found or dismissal fails
   */
  public static async dismiss(name: string): Promise<void> {
    const instance = TrueSheet.getInstance(name);
    if (!instance) {
      throw new Error(`Sheet with name "${name}" not found`);
    }

    return instance.dismiss();
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

  /**
   * Present the Sheet by `index` (Promise-based)
   * @param index - Detent index (default: 0)
   */
  public async present(index: number = 0): Promise<void> {
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

    return TrueSheetModule?.presentByRef(this.handle, index);
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
   */
  public async dismiss(): Promise<void> {
    return TrueSheetModule?.dismissByRef(this.handle);
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
      grabber = true,
      dimmed = true,
      initialDetentIndex = -1,
      initialDetentAnimated = true,
      keyboardMode = 'resize',
      dimmedDetentIndex,
      blurTint,
      cornerRadius,
      maxHeight,
      edgeToEdgeFullScreen,
      fitScrollView = false,
      pageSizing = true,
      children,
      style,
      header,
      footer,
      testID,
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
        style={styles.sheetView}
        detents={resolvedDetents}
        blurTint={blurTint}
        background={(processColor(backgroundColor) as number) ?? 0}
        cornerRadius={cornerRadius}
        grabber={grabber}
        dimmed={dimmed}
        dimmedDetentIndex={dimmedDetentIndex}
        keyboardMode={keyboardMode}
        initialDetentIndex={initialDetentIndex}
        initialDetentAnimated={initialDetentAnimated}
        dismissible={dismissible}
        maxHeight={maxHeight}
        edgeToEdgeFullScreen={edgeToEdgeFullScreen}
        fitScrollView={fitScrollView}
        pageSizing={pageSizing}
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
      >
        {this.state.shouldRenderNativeView && (
          <TrueSheetContainerViewNativeComponent testID={testID} collapsable={false}>
            {header && (
              <TrueSheetHeaderViewNativeComponent collapsable={false}>
                {isValidElement(header) ? header : createElement(header)}
              </TrueSheetHeaderViewNativeComponent>
            )}
            <TrueSheetContentViewNativeComponent style={style} collapsable={false}>
              {children}
            </TrueSheetContentViewNativeComponent>
            {footer && (
              <TrueSheetFooterViewNativeComponent style={styles.footer} collapsable={false}>
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
    position: 'absolute',
    width: '100%',
    zIndex: -9999,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
