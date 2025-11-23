package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired continuously for position updates during drag and animation
 * Payload: { index: number, position: number, transitioning: boolean }
 */
class PositionChangeEvent(
  surfaceId: Int,
  viewId: Int,
  private val index: Int,
  private val position: Float,
  private val transitioning: Boolean = false
) : Event<PositionChangeEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putInt("index", index)
      putDouble("position", position.toDouble())
      putBoolean("transitioning", transitioning)
    }

  companion object {
    const val EVENT_NAME = "topPositionChange"
    const val REGISTRATION_NAME = "onPositionChange"
  }
}
