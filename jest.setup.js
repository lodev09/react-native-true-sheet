/* eslint-env jest */

// Mock the native module
jest.mock('./src/specs/NativeTrueSheetModule', () => ({
  __esModule: true,
  default: {
    presentByRef: jest.fn(),
    dismissByRef: jest.fn(),
  },
}));

// Mock the native components
jest.mock('./src/fabric/TrueSheetViewNativeComponent', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      return React.createElement(View, { ...props, ref });
    }),
  };
});

jest.mock('./src/fabric/TrueSheetContainerViewNativeComponent', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      return React.createElement(View, { ...props, ref });
    }),
  };
});

jest.mock('./src/fabric/TrueSheetContentViewNativeComponent', () => {
  const React = require('react');
  const { ScrollView } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      return React.createElement(ScrollView, { ...props, ref });
    }),
  };
});

jest.mock('./src/fabric/TrueSheetHeaderViewNativeComponent', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      return React.createElement(View, { ...props, ref });
    }),
  };
});

jest.mock('./src/fabric/TrueSheetFooterViewNativeComponent', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      return React.createElement(View, { ...props, ref });
    }),
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  default: {
    call: () => {},
    createAnimatedComponent: (component) => component,
  },
  useSharedValue: jest.fn((initial) => ({ value: initial })),
  useAnimatedStyle: jest.fn((callback) => callback()),
  withTiming: jest.fn((value) => value),
  withSpring: jest.fn((value) => value),
  runOnJS: jest.fn((fn) => fn),
  createAnimatedComponent: (component) => component,
  useEvent: jest.fn(() => jest.fn()),
  useHandler: jest.fn(() => ({ context: {}, doDependenciesDiffer: false })),
  Easing: {
    bezier: jest.fn(() => jest.fn()),
  },
}));

// Mock react-native-worklets
jest.mock('react-native-worklets-core', () => ({}), { virtual: true });
jest.mock(
  'react-native-worklets',
  () => ({
    scheduleOnRN: jest.fn((fn) => fn),
    scheduleOnJS: jest.fn((fn) => fn),
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useWorklet: jest.fn((fn) => fn),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
  }),
  { virtual: true }
);
