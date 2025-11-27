package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired when the sheet loses focus because another sheet is presented on top of it
 */
class BlurEvent(surfaceId: Int, viewId: Int) : Event<BlurEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topDidBlur"
    const val REGISTRATION_NAME = "onDidBlur"
  }
}
