package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired when the sheet regains focus after a sheet on top of it is dismissed
 */
class FocusEvent(surfaceId: Int, viewId: Int) : Event<FocusEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topDidFocus"
    const val REGISTRATION_NAME = "onDidFocus"
  }
}
