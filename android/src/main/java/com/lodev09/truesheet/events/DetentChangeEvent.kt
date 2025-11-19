package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired when the active detent changes
 * Payload: { index: number, position: number }
 */
class DetentChangeEvent(
  surfaceId: Int,
  viewId: Int,
  private val index: Int,
  private val position: Float
) : Event<DetentChangeEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    return Arguments.createMap().apply {
      putInt("index", index)
      putDouble("position", position.toDouble())
    }
  }

  companion object {
    const val EVENT_NAME = "topDetentChange"
    const val REGISTRATION_NAME = "onDetentChange"
  }
}