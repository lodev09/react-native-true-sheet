import React, { createElement, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import type { TrueSheetProps, TrueSheetContextMethods } from '../TrueSheet.types';

interface TrueSheetState {
  shouldRenderNativeView: boolean;
}

/**
 * Mock TrueSheet component for testing.
 * Import from '@lodev09/react-native-true-sheet/mock' in your test setup.
 */
export class TrueSheet extends React.Component<TrueSheetProps, TrueSheetState> {
  static instances: Record<string, TrueSheet> = {};

  static dismiss = jest.fn((_name: string, _animated?: boolean) => Promise.resolve());
  static dismissStack = jest.fn((_name: string, _animated?: boolean) => Promise.resolve());
  static present = jest.fn((_name: string, _index?: number, _animated?: boolean) =>
    Promise.resolve()
  );
  static resize = jest.fn((_name: string, _index: number) => Promise.resolve());
  static dismissAll = jest.fn((_animated?: boolean) => Promise.resolve());

  dismiss = jest.fn((_animated?: boolean) => Promise.resolve());
  dismissStack = jest.fn((_animated?: boolean) => Promise.resolve());
  present = jest.fn((_index?: number, _animated?: boolean) => Promise.resolve());
  resize = jest.fn((_index: number) => Promise.resolve());

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
 * Mock TrueSheetProvider for testing.
 */
export function TrueSheetProvider({ children }: { children: React.ReactNode }) {
  return children;
}

/**
 * Mock useTrueSheet hook for testing.
 */
export function useTrueSheet(): TrueSheetContextMethods {
  return {
    present: TrueSheet.present,
    dismiss: TrueSheet.dismiss,
    dismissStack: TrueSheet.dismissStack,
    resize: TrueSheet.resize,
    dismissAll: TrueSheet.dismissAll,
  };
}

export * from '../TrueSheet.types';
