package com.lodev09.truesheet.core

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.lodev09.truesheet.SizeInfo

// onPresent
class PresentEvent(surfaceId: Int, viewId: Int, private val sizeInfo: SizeInfo) : Event<PresentEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME

  override fun getEventData(): WritableMap {
    val data = Arguments.createMap()
    data.putInt("index", sizeInfo.index)
    data.putDouble("value", sizeInfo.value.toDouble())

    return data
  }

  companion object {
    const val EVENT_NAME = "present"
  }
}

// onDismiss
class DismissEvent(surfaceId: Int, viewId: Int) : Event<PresentEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "dismiss"
  }
}

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
