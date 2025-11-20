import React from 'react';
import { View } from 'react-native';

// Mock TrueSheet class component
export class TrueSheet extends React.Component {
  static instances = {};

  // Static methods
  static dismiss = jest.fn((name) => Promise.resolve());
  static present = jest.fn((name, index = 0) => Promise.resolve());
  static resize = jest.fn((name, index) => Promise.resolve());

  // Instance methods
  dismiss = jest.fn(() => Promise.resolve());
  present = jest.fn((index = 0) => Promise.resolve());
  resize = jest.fn((index) => Promise.resolve());

  componentDidMount() {
    const { name } = this.props;
    if (name) {
      TrueSheet.instances[name] = this;
    }
  }

  componentWillUnmount() {
    const { name } = this.props;
    if (name) {
      delete TrueSheet.instances[name];
    }
  }

  render() {
    const { children, footer, style, ...rest } = this.props;
    return (
      <View style={style} {...rest}>
        {children}
        {footer}
      </View>
    );
  }
}

// Mock ReanimatedTrueSheet
export class ReanimatedTrueSheet extends TrueSheet {
  render() {
    return <TrueSheet {...this.props} />;
  }
}

// Mock TrueSheetGrabber
export const TrueSheetGrabber = ({ style, ...props }) => (
  <View style={style} {...props} testID="true-sheet-grabber" />
);

// Mock ReanimatedTrueSheetProvider
export const ReanimatedTrueSheetProvider = ({ children }) => <>{children}</>;

// Mock hooks
export const useReanimatedTrueSheet = jest.fn(() => ({
  sheetRef: { current: null },
  position: { value: 0 },
}));

export const usePositionChangeHandler = jest.fn((callback) => jest.fn());

// Re-export types (these will be no-ops in JS but useful for TS consumers)
export * from '../TrueSheet.types';