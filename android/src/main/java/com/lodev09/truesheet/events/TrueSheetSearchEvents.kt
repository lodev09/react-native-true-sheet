package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Fired when the nav bar search text changes
 * Payload: { text: string }
 */
class SearchChangeEvent(surfaceId: Int, viewId: Int, private val text: String) : Event<SearchChangeEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putString("text", text)
    }

  companion object {
    const val EVENT_NAME = "topSearchChange"
    const val REGISTRATION_NAME = "onSearchChange"
  }
}

/**
 * Fired when the nav bar search is submitted
 * Payload: { text: string }
 */
class SearchSubmitEvent(surfaceId: Int, viewId: Int, private val text: String) : Event<SearchSubmitEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putString("text", text)
    }

  companion object {
    const val EVENT_NAME = "topSearchSubmit"
    const val REGISTRATION_NAME = "onSearchSubmit"
  }
}

/**
 * Fired when the nav bar search field gains focus
 */
class SearchFocusEvent(surfaceId: Int, viewId: Int) : Event<SearchFocusEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topSearchFocus"
    const val REGISTRATION_NAME = "onSearchFocus"
  }
}

/**
 * Fired when the nav bar search field loses focus
 */
class SearchBlurEvent(surfaceId: Int, viewId: Int) : Event<SearchBlurEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topSearchBlur"
    const val REGISTRATION_NAME = "onSearchBlur"
  }
}

/**
 * Fired when the nav bar search is cancelled (search view collapsed)
 */
class SearchCancelEvent(surfaceId: Int, viewId: Int) : Event<SearchCancelEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topSearchCancel"
    const val REGISTRATION_NAME = "onSearchCancel"
  }
}
