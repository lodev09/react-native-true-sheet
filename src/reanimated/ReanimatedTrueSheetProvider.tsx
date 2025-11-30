import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

export interface ReanimatedTrueSheetContextValue {
  /**
   * Shared value representing the current sheet position (Y offset from top of screen)
   */
  animatedPosition: SharedValue<number>;
  /**
   * Shared value representing the current detent index as a continuous float.
   * Interpolates smoothly between -1 (off-screen) and the target detent index.
   */
  animatedIndex: SharedValue<number>;
  /**
   * Shared value representing the current detent value (0-1 fraction of screen height).
   * Interpolates smoothly between detent values as the sheet is dragged.
   */
  animatedDetent: SharedValue<number>;
}

const ReanimatedTrueSheetContext = createContext<ReanimatedTrueSheetContextValue | null>(null);

export interface ReanimatedTrueSheetProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages shared values for Reanimated TrueSheet.
 * Wrap your app or component tree with this provider to enable Reanimated integration.
 *
 * @example
 * ```tsx
 * import { ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet'
 *
 * function App() {
 *   return (
 *     <ReanimatedTrueSheetProvider>
 *       <YourApp />
 *     </ReanimatedTrueSheetProvider>
 *   )
 * }
 * ```
 */
export const ReanimatedTrueSheetProvider = ({ children }: ReanimatedTrueSheetProviderProps) => {
  const { height } = useWindowDimensions();
  const animatedPosition = useSharedValue(height);
  const animatedIndex = useSharedValue(-1);
  const animatedDetent = useSharedValue(0);

  const value = useMemo(
    () => ({
      animatedPosition,
      animatedIndex,
      animatedDetent,
    }),
    [animatedPosition, animatedIndex, animatedDetent]
  );

  return (
    <ReanimatedTrueSheetContext.Provider value={value}>
      {children}
    </ReanimatedTrueSheetContext.Provider>
  );
};

/**
 * Hook to access the Reanimated TrueSheet context.
 * Returns the shared values for sheet position and detent index that can be used in animations.
 *
 * @throws Error if used outside of ReanimatedTrueSheetProvider
 *
 * @example
 * ```tsx
 * import { useReanimatedTrueSheet } from '@lodev09/react-native-true-sheet'
 * import { useAnimatedStyle } from 'react-native-reanimated'
 *
 * function MyComponent() {
 *   const { animatedPosition, animatedIndex } = useReanimatedTrueSheet()
 *
 *   const animatedStyle = useAnimatedStyle(() => ({
 *     transform: [{ translateY: -animatedPosition.value }]
 *   }))
 *
 *   return <Animated.View style={animatedStyle}>...</Animated.View>
 * }
 * ```
 */
export const useReanimatedTrueSheet = (): ReanimatedTrueSheetContextValue => {
  const context = useContext(ReanimatedTrueSheetContext);

  if (!context) {
    throw new Error(
      'useReanimatedTrueSheet must be used within a ReanimatedTrueSheetProvider. ' +
        'Make sure to wrap your component tree with <ReanimatedTrueSheetProvider>.'
    );
  }

  return context;
};
