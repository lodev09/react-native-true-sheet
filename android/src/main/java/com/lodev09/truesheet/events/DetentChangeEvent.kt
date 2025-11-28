package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired when the active detent changes
 * Payload: { index: number, position: number }
 */
class DetentChangeEvent(surfaceId: Int, viewId: Int, private val index: Int, private val position: Float, private val detent: Float) :
  Event<DetentChangeEvent>(surfaceId, viewId) {

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
