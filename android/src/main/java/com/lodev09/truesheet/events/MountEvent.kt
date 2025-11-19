package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired when the sheet component is mounted and ready
 */
class MountEvent(
  surfaceId: Int,
  viewId: Int
) : Event<MountEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topMount"
    const val REGISTRATION_NAME = "onMount"
  }
}