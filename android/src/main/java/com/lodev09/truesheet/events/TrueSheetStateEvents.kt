package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * State events: detentChange, positionChange
 */

/**
 * Fired when the detent changes
 * Payload: { index: number, position: number, detent: number }
 */
class DetentChangeEvent(
  surfaceId: Int,
  viewId: Int,
  private val index: Int,
  private val position: Float,
  private val detent: Float
) : Event<DetentChangeEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putInt("index", index)
      putDouble("position", position.toDouble())
      putDouble("detent", detent.toDouble())
    }

  companion object {
    const val EVENT_NAME = "topDetentChange"
    const val REGISTRATION_NAME = "onDetentChange"
  }
}

/**
 * Fired continuously for position updates during drag and animation
 * Payload: { index: number, position: number, detent: number, transitioning: boolean }
 */
class PositionChangeEvent(
  surfaceId: Int,
  viewId: Int,
  private val index: Float,
  private val position: Float,
  private val detent: Float,
  private val transitioning: Boolean = false
) : Event<PositionChangeEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putDouble("index", index.toDouble())
      putDouble("position", position.toDouble())
      putDouble("detent", detent.toDouble())
      putBoolean("transitioning", transitioning)
    }

  companion object {
    const val EVENT_NAME = "topPositionChange"
    const val REGISTRATION_NAME = "onPositionChange"
  }
}
