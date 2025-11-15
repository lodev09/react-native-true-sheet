import type { HostComponent, ViewProps } from 'react-native';
import type { DirectEventHandler, Double, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
export interface SizeInfo {
    index: Int32;
    value: Double;
}
export interface ContainerSize {
    width: Double;
    height: Double;
}
export interface NativeProps extends ViewProps {
    sizes?: ReadonlyArray<string>;
    scrollableHandle?: WithDefault<Int32, 0>;
    maxHeight?: WithDefault<Double, 0>;
    background?: WithDefault<Int32, 0>;
    cornerRadius?: WithDefault<Double, 0>;
    contentHeight?: WithDefault<Double, 0>;
    footerHeight?: WithDefault<Double, 0>;
    initialIndex?: WithDefault<Int32, -1>;
    dimmedIndex?: WithDefault<Int32, 0>;
    blurTint?: WithDefault<string, ''>;
    keyboardMode?: WithDefault<'resize' | 'pan', 'resize'>;
    grabber?: WithDefault<boolean, true>;
    dismissible?: WithDefault<boolean, true>;
    dimmed?: WithDefault<boolean, true>;
    initialIndexAnimated?: WithDefault<boolean, true>;
    edgeToEdge?: WithDefault<boolean, false>;
    onMount?: DirectEventHandler<null>;
    onPresent?: DirectEventHandler<SizeInfo>;
    onDismiss?: DirectEventHandler<null>;
    onSizeChange?: DirectEventHandler<SizeInfo>;
    onDragBegin?: DirectEventHandler<SizeInfo>;
    onDragChange?: DirectEventHandler<SizeInfo>;
    onDragEnd?: DirectEventHandler<SizeInfo>;
    onContainerSizeChange?: DirectEventHandler<ContainerSize>;
}
export interface NativeCommands {
    present: (viewRef: React.ElementRef<HostComponent<NativeProps>>, index: Int32) => void;
    dismiss: (viewRef: React.ElementRef<HostComponent<NativeProps>>) => void;
}
export declare const Commands: NativeCommands;
declare const _default: HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=TrueSheetViewNativeComponent.d.ts.map