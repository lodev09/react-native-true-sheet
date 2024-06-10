package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.lodev09.truesheet.SizeInfo

// onSizeChange
class SizeChangeEvent(surfaceId: Int, viewId: Int, private val sizeInfo: SizeInfo) : Event<SizeChangeEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME

  override fun getEventData(): WritableMap {
    val data = Arguments.createMap()
    data.putInt("index", sizeInfo.index)
    data.putDouble("value", sizeInfo.value.toDouble())

    return data
  }

  companion object {
    const val EVENT_NAME = "sizeChange"
  }
}
