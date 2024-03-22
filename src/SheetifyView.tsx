import React, { PureComponent, Component, type RefObject, createRef, type ReactNode } from 'react'
import {
  requireNativeComponent,
  Platform,
  findNodeHandle,
  type NativeMethods,
  type ViewStyle,
  View,
  type ViewProps,
} from 'react-native'

import type { SheetifyViewProps } from './types'
import { SheetifyModule } from './SheetifyModule'

const LINKING_ERROR =
  `The package 'react-native-sheetify' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

const ComponentName = 'SheetifyView'

interface SheetifyNativeViewProps extends SheetifyViewProps {
  scrollableHandle: number | null
  footerHandle: number | null
}

const SheetifyNativeView = requireNativeComponent<SheetifyNativeViewProps>(ComponentName)

if (!SheetifyNativeView) {
  throw new Error(LINKING_ERROR)
}

type nativeRef = Component<SheetifyNativeViewProps> & Readonly<NativeMethods>
type FooterRef = Component<ViewProps> & Readonly<NativeMethods>

interface SheetifyState {
  scrollableHandle: number | null
  footerHandle: number | null
}

export class SheetifyView extends PureComponent<SheetifyViewProps, SheetifyState> {
  displayName = 'Sheetify'
  private readonly ref: RefObject<nativeRef>
  private readonly footerRef: React.RefObject<FooterRef>

  constructor(props: SheetifyViewProps) {
    super(props)
    this.ref = createRef<nativeRef>()
    this.footerRef = createRef<FooterRef>()

    this.state = {
      footerHandle: null,
      scrollableHandle: null,
    }
  }

  private get handle(): number {
    const nodeHandle = findNodeHandle(this.ref.current)
    if (nodeHandle == null || nodeHandle === -1) {
      throw new Error(`Could not get native view tag`)
    }

    return nodeHandle
  }

  private updateHandles() {
    let scrollableHandle = null
    let footerHandle = null

    if (this.props.scrollRef?.current) {
      scrollableHandle = findNodeHandle(this.props.scrollRef.current)
    }

    if (this.footerRef.current) {
      footerHandle = findNodeHandle(this.footerRef.current)
    }

    this.setState({
      footerHandle,
      scrollableHandle,
    })
  }

  componentDidMount(): void {
    this.updateHandles()
  }

  componentDidUpdate(): void {
    this.updateHandles()
  }

  /**
   * Present the modal sheet
   */
  public async present() {
    await SheetifyModule.present(this.handle)
  }

  render(): ReactNode {
    const FooterComponent = this.props.FooterComponent

    return (
      <SheetifyNativeView
        ref={this.ref}
        scrollableHandle={this.state.scrollableHandle}
        footerHandle={this.state.footerHandle}
        sizes={this.props.sizes ?? ['medium', 'large']}
        backgroundColor={this.props.backgroundColor}
        style={$sheetify}
      >
        <View style={this.props.style}>
          {this.props.children}
          {!!FooterComponent && (
            <View ref={this.footerRef}>
              <FooterComponent />
            </View>
          )}
        </View>
      </SheetifyNativeView>
    )
  }
}

const $sheetify: ViewStyle = {
  position: 'absolute',
  width: 0,
  zIndex: -99,
}
