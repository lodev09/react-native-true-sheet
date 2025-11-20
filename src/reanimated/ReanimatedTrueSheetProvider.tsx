import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

export interface ReanimatedTrueSheetContextValue {
  /**
   * Shared value representing the current sheet position (Y offset from bottom)
   */
  position: SharedValue<number>;
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
  const position = useSharedValue(height);

  const value = useMemo(
    () => ({
      position,
    }),
    [position]
  );

  return (
    <ReanimatedTrueSheetContext.Provider value={value}>
      {children}
    </ReanimatedTrueSheetContext.Provider>
  );
};

/**
 * Hook to access the Reanimated TrueSheet context.
 * Returns the shared value for sheet position that can be used in animations.
 *
 * @throws Error if used outside of ReanimatedTrueSheetProvider
 *
 * @example
 * ```tsx
 * import { useReanimatedTrueSheet } from '@lodev09/react-native-true-sheet'
 * import { useAnimatedStyle } from 'react-native-reanimated'
 *
 * function MyComponent() {
 *   const { position } = useReanimatedTrueSheet()
 *
 *   const animatedStyle = useAnimatedStyle(() => ({
 *     transform: [{ translateY: -position.value }]
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
