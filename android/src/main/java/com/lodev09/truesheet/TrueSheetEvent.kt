package com.lodev09.truesheet

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class TrueSheetEvent(surfaceId: Int, viewId: Int, private val name: String, private val data: WritableMap?) :
  Event<TrueSheetEvent>(surfaceId, viewId) {
  override fun getEventName() = name
  override fun getEventData(): WritableMap = data ?: Arguments.createMap()

  companion object {
    const val MOUNT = "mount"
    const val PRESENT = "present"
    const val DISMISS = "dismiss"
    const val SIZE_CHANGE = "sizeChange"
    const val DRAG_BEGIN = "dragBegin"
    const val DRAG_CHANGE = "dragChange"
    const val DRAG_END = "dragEnd"
    const val CONTAINER_SIZE_CHANGE = "containerSizeChange"
  }
}
