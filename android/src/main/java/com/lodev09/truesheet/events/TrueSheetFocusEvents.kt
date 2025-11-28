package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired when the sheet is about to regain focus because a sheet on top of it is being dismissed
 */
class WillFocusEvent(surfaceId: Int, viewId: Int) : Event<WillFocusEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topWillFocus"
    const val REGISTRATION_NAME = "onWillFocus"
  }
}

/**
 * Fired when the sheet regains focus after a sheet on top of it is dismissed
 */
class FocusEvent(surfaceId: Int, viewId: Int) : Event<FocusEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topDidFocus"
    const val REGISTRATION_NAME = "onDidFocus"
  }
}

/**
 * Fired when the sheet is about to lose focus because another sheet is being presented on top of it
 */
class WillBlurEvent(surfaceId: Int, viewId: Int) : Event<WillBlurEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topWillBlur"
    const val REGISTRATION_NAME = "onWillBlur"
  }
}

/**
 * Fired when the sheet loses focus because another sheet is presented on top of it
 */
class BlurEvent(surfaceId: Int, viewId: Int) : Event<BlurEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topDidBlur"
    const val REGISTRATION_NAME = "onDidBlur"
  }
}
