package com.lodev09.truesheet

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class TrueSheetEvent(surfaceId: Int, viewId: Int, private val name: String, private val data: WritableMap?) :
  Event<TrueSheetEvent>(surfaceId, viewId) {
  override fun getEventName() = name
  override fun getEventData(): WritableMap = data ?: Arguments.createMap()

  companion object {
    const val MOUNT = "topMount"
    const val WILL_PRESENT = "topWillPresent"
    const val DID_PRESENT = "topDidPresent"
    const val WILL_DISMISS = "topWillDismiss"
    const val DID_DISMISS = "topDidDismiss"
    const val DETENT_CHANGE = "topDetentChange"
    const val DRAG_BEGIN = "topDragBegin"
    const val DRAG_CHANGE = "topDragChange"
    const val DRAG_END = "topDragEnd"
    const val POSITION_CHANGE = "topPositionChange"
    const val CONTAINER_SIZE_CHANGE = "topContainerSizeChange"
  }
}
