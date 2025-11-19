package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired when user stops dragging the sheet
 * Payload: { index: number, position: number }
 */
class DragEndEvent(surfaceId: Int, viewId: Int, private val index: Int, private val position: Float) :
  Event<DragEndEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putInt("index", index)
      putDouble("position", position.toDouble())
    }

  companion object {
    const val EVENT_NAME = "topDragEnd"
    const val REGISTRATION_NAME = "onDragEnd"
  }
}
