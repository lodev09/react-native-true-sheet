package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired before the sheet is dismissed
 */
class WillDismissEvent(
  surfaceId: Int,
  viewId: Int
) : Event<WillDismissEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topWillDismiss"
    const val REGISTRATION_NAME = "onWillDismiss"
  }
}