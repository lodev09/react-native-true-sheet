import React from 'react'
import { View } from 'react-native'

export * from '../TrueSheetGrabber'

export class TrueSheet extends React.Component {
  dismiss = jest.fn()
  present = jest.fn()
  resize = jest.fn()

  render() {
    return <View {...this.props} />
  }
}
