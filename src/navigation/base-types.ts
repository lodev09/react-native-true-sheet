/**
 * Base navigation types for the React Navigation entry point.
 *
 * The Expo Router entry has its own copy sourced from `expo-router/react-navigation`
 * (see `./expo-router/base-types`) because Expo Router apps never install
 * `@react-navigation/*` — importing it there would silently resolve to `any`.
 */
export type {
  DefaultNavigatorOptions,
  Descriptor,
  NavigationAction,
  NavigationHelpers,
  NavigationProp,
  NavigationState,
  ParamListBase,
  RouteProp,
  Router,
  StackActionHelpers,
  StackRouterOptions,
} from '@react-navigation/core';
