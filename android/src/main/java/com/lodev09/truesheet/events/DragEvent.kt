package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.lodev09.truesheet.SizeInfo

// onDrag
class DragEvent(surfaceId: Int, viewId: Int, private val state: String, private val sizeInfo: SizeInfo) :
  Event<DragEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME

  override fun getEventData(): WritableMap {
    val sizeInfoData = Arguments.createMap()
    sizeInfoData.putInt("index", sizeInfo.index)
    sizeInfoData.putDouble("value", sizeInfo.value.toDouble())

    val data = Arguments.createMap()
    data.putString("state", state)
    data.putMap("sizeInfo", sizeInfoData)

    return data
  }

  companion object {
    const val EVENT_NAME = "drag"
  }
}
