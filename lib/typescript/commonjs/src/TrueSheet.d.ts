import { PureComponent, type ReactNode } from 'react';
import { type NativeSyntheticEvent } from 'react-native';
import type { TrueSheetProps } from './TrueSheet.types';
export type ContainerSizeChangeEvent = NativeSyntheticEvent<{
    width: number;
    height: number;
}>;
interface TrueSheetState {
    containerWidth?: number;
    containerHeight?: number;
    contentHeight?: number;
    footerHeight?: number;
    scrollableHandle: number | null;
}
export declare class TrueSheet extends PureComponent<TrueSheetProps, TrueSheetState> {
    displayName: string;
    private readonly ref;
    /**
     * Map of sheet names against their ref.
     */
    private static readonly refs;
    constructor(props: TrueSheetProps);
    private static getRef;
    /**
     * Present the sheet by given `name` (Promise-based)
     * @param name - Sheet name (must match sheet's name prop)
     * @param index - Size index (default: 0)
     * @returns Promise that resolves when sheet is fully presented
     * @throws Error if sheet not found or presentation fails
     */
    static present(name: string, index?: number): Promise<void>;
    /**
     * Dismiss the sheet by given `name` (Promise-based)
     * @param name - Sheet name
     * @returns Promise that resolves when sheet is fully dismissed
     * @throws Error if sheet not found or dismissal fails
     */
    static dismiss(name: string): Promise<void>;
    /**
     * Resize the sheet by given `name` (Promise-based)
     * @param name - Sheet name
     * @param index - New size index
     * @returns Promise that resolves when resize is complete
     * @throws Error if sheet not found
     */
    static resize(name: string, index: number): Promise<void>;
    private updateState;
    private onSizeChange;
    private onContainerSizeChange;
    private onPresent;
    private onFooterLayout;
    private onContentLayout;
    private onDismiss;
    private onMount;
    private onDragBegin;
    private onDragChange;
    private onDragEnd;
    /**
     * Present the sheet. Optionally accepts a size `index`.
     * See `sizes` prop
     */
    present(index?: number): Promise<void>;
    /**
     * Resizes the Sheet programmatically by `index`.
     * This is an alias of the `present(index)` method.
     */
    resize(index: number): Promise<void>;
    /**
     * Dismisses the Sheet
     */
    dismiss(): Promise<void>;
    componentDidMount(): void;
    componentDidUpdate(): void;
    render(): ReactNode;
}
export {};
//# sourceMappingURL=TrueSheet.d.ts.map