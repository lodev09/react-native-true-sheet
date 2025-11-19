package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired after the sheet dismissal is complete
 */
class DidDismissEvent(surfaceId: Int, viewId: Int) : Event<DidDismissEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topDidDismiss"
    const val REGISTRATION_NAME = "onDidDismiss"
  }
}
