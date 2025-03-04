import { type ColorValue, type ViewStyle, type StyleProp } from 'react-native';
export interface TrueSheetGrabberProps {
    /**
     * Is grabber visible.
     * @default true
     */
    visible?: boolean;
    /**
     * Optional style that overrides the default style.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Grabber color according to M3 specs.
     * @default rgba(73,69,79,0.4)
     */
    color?: ColorValue;
    /**
     * Grabber height according to M3 specs.
     * @default 4
     */
    height?: number;
    /**
     * Grabber top position offset.
     *
     * @default 6
     */
    topOffset?: number;
    /**
     * Grabber width according to M3 specs.
     * @default 32
     */
    width?: number;
}
/**
 * Grabber component.
 * Used by defualt for Android but feel free to re-use.
 */
export declare const TrueSheetGrabber: (props: TrueSheetGrabberProps) => import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=TrueSheetGrabber.d.ts.map