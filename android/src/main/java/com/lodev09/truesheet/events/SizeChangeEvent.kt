package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.events.Event

/**
 * Fired when the root view's size changes
 * Payload: { width: number, height: number }
 */
class SizeChangeEvent(surfaceId: Int, viewId: Int, private val width: Int, private val height: Int) :
  Event<SizeChangeEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putDouble("width", PixelUtil.toDIPFromPixel(width.toFloat()).toDouble())
      putDouble("height", PixelUtil.toDIPFromPixel(height.toFloat()).toDouble())
    }

  companion object {
    const val EVENT_NAME = "topSizeChange"
    const val REGISTRATION_NAME = "onSizeChange"
  }
}