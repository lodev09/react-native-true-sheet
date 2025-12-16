import React, { createElement, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { TrueSheetProps, TrueSheetRef, PositionChangeEventPayload } from '../TrueSheet.types';

interface TrueSheetState {
  shouldRenderNativeView: boolean;
}

interface MockReanimatedTrueSheetContextValue {
  animatedPosition: SharedValue<number>;
  animatedIndex: SharedValue<number>;
  animatedDetent: SharedValue<number>;
}

const createMockSharedValue = <T>(initialValue: T): SharedValue<T> =>
  ({
    value: initialValue,
    get: () => initialValue,
    set: () => {},
    addListener: () => () => {},
    removeListener: () => {},
    modify: () => {},
  }) as unknown as SharedValue<T>;

/**
 * Mock ReanimatedTrueSheet component for testing.
 * Import from '@lodev09/react-native-true-sheet/reanimated/mock' in your test setup.
 */
export class ReanimatedTrueSheet
  extends React.Component<TrueSheetProps, TrueSheetState>
  implements TrueSheetRef
{
  static instances: Record<string, ReanimatedTrueSheet> = {};

  static dismiss = jest.fn((_name: string, _animated?: boolean) => Promise.resolve());
  static present = jest.fn((_name: string, _index?: number, _animated?: boolean) =>
    Promise.resolve()
  );
  static resize = jest.fn((_name: string, _index: number) => Promise.resolve());

  dismiss = jest.fn((_animated?: boolean) => Promise.resolve());
  present = jest.fn((_index?: number, _animated?: boolean) => Promise.resolve());
  resize = jest.fn((_index: number) => Promise.resolve());

  componentDidMount() {
    const { name } = this.props;
    if (name) {
      ReanimatedTrueSheet.instances[name] = this;
    }
  }

  componentWillUnmount() {
    const { name } = this.props;
    if (name) {
      delete ReanimatedTrueSheet.instances[name];
    }
  }

  private renderHeader(): ReactNode {
    const { header } = this.props;
    if (!header) return null;
    return isValidElement(header) ? header : createElement(header);
  }

  private renderFooter(): ReactNode {
    const { footer } = this.props;
    if (!footer) return null;
    return isValidElement(footer) ? footer : createElement(footer);
  }

  render() {
    const { children, style } = this.props;
    return React.createElement(View, { style }, this.renderHeader(), children, this.renderFooter());
  }
}

/**
 * Mock ReanimatedTrueSheetProvider for testing.
 */
export function ReanimatedTrueSheetProvider({ children }: { children: React.ReactNode }) {
  return children;
}

/**
 * Mock useReanimatedTrueSheet hook for testing.
 */
export const useReanimatedTrueSheet = jest.fn(
  (): MockReanimatedTrueSheetContextValue => ({
    animatedPosition: createMockSharedValue(0),
    animatedIndex: createMockSharedValue(-1),
    animatedDetent: createMockSharedValue(0),
  })
);

/**
 * Mock useReanimatedPositionChangeHandler hook for testing.
 */
export const useReanimatedPositionChangeHandler = jest.fn(
  (_handler: (payload: PositionChangeEventPayload) => void, _dependencies?: unknown[]) => jest.fn()
);
