package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

// onContainerSizeChange
class ContainerSizeChangeEvent(surfaceId: Int, viewId: Int, private val width: Float, private val height: Float) :
  Event<ContainerSizeChangeEvent>(surfaceId, viewId) {
  override fun getEventName() = EVENT_NAME

  override fun getEventData(): WritableMap {
    val data = Arguments.createMap()
    data.putDouble("width", width.toDouble())
    data.putDouble("height", height.toDouble())

    return data
  }

  companion object {
    const val EVENT_NAME = "containerSizeChange"
  }
}
