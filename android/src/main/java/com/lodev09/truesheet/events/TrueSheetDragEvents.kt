package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Drag events: dragBegin, dragChange, dragEnd
 */

/**
 * Fired when dragging begins
 * Payload: { index: number, position: number, detent: number }
 */
class DragBeginEvent(surfaceId: Int, viewId: Int, private val index: Int, private val position: Float, private val detent: Float) :
  Event<DragBeginEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putInt("index", index)
      putDouble("position", position.toDouble())
      putDouble("detent", detent.toDouble())
    }

  companion object {
    const val EVENT_NAME = "topDragBegin"
    const val REGISTRATION_NAME = "onDragBegin"
  }
}

/**
 * Fired continuously during dragging
 * Payload: { index: number, position: number, detent: number }
 */
class DragChangeEvent(surfaceId: Int, viewId: Int, private val index: Int, private val position: Float, private val detent: Float) :
  Event<DragChangeEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putInt("index", index)
      putDouble("position", position.toDouble())
      putDouble("detent", detent.toDouble())
    }

  companion object {
    const val EVENT_NAME = "topDragChange"
    const val REGISTRATION_NAME = "onDragChange"
  }
}

/**
 * Fired when dragging ends
 * Payload: { index: number, position: number, detent: number }
 */
class DragEndEvent(surfaceId: Int, viewId: Int, private val index: Int, private val position: Float, private val detent: Float) :
  Event<DragEndEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putInt("index", index)
      putDouble("position", position.toDouble())
      putDouble("detent", detent.toDouble())
    }

  companion object {
    const val EVENT_NAME = "topDragEnd"
    const val REGISTRATION_NAME = "onDragEnd"
  }
}
