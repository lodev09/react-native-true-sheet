import React from 'react'
import { View } from 'react-native'

export default class TrueSheet extends React.Component {
  dismiss = jest.fn()
  present = jest.fn()

  render() {
    return <View {...this.props} />
  }
}
