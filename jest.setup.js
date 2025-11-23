/* eslint-env jest */
// Mock the native module
jest.mock('./src/specs/NativeTrueSheetModule', () => ({
  __esModule: true,
  default: {
    present: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
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

// Mock reanimated if it's being used
jest.mock('react-native-reanimated', () => {
  return {
    default: {
      call: () => {},
      createAnimatedComponent: (component) => component,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn((callback) => callback()),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    runOnJS: jest.fn((fn) => fn),
    createAnimatedComponent: (component) => component,
    Easing: {
      bezier: jest.fn(() => jest.fn()),
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      sin: jest.fn(),
      circle: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(),
      back: jest.fn(),
      bounce: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
  };
});

// Mock worklets if it's being used
jest.mock('react-native-worklets-core', () => ({}), { virtual: true });

jest.mock(
  'react-native-worklets',
  () => ({
    scheduleOnRN: jest.fn((fn) => fn),
    scheduleOnJS: jest.fn((fn) => fn),
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useWorklet: jest.fn((fn) => fn),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
  }),
  { virtual: true }
);