package com.lodev09.truesheet.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Lifecycle events: mount, willPresent, didPresent, willDismiss, didDismiss
 */

/**
 * Fired when the sheet component is mounted and ready
 */
class MountEvent(surfaceId: Int, viewId: Int) : Event<MountEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topMount"
    const val REGISTRATION_NAME = "onMount"
  }
}

/**
 * Fired before the sheet is presented
 * Payload: { index: number, position: number, detent: number }
 */
class WillPresentEvent(surfaceId: Int, viewId: Int, private val index: Int, private val position: Float, private val detent: Float) :
  Event<WillPresentEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putInt("index", index)
      putDouble("position", position.toDouble())
      putDouble("detent", detent.toDouble())
    }

  companion object {
    const val EVENT_NAME = "topWillPresent"
    const val REGISTRATION_NAME = "onWillPresent"
  }
}

/**
 * Fired after the sheet is presented
 * Payload: { index: number, position: number, detent: number }
 */
class DidPresentEvent(surfaceId: Int, viewId: Int, private val index: Int, private val position: Float, private val detent: Float) :
  Event<DidPresentEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap =
    Arguments.createMap().apply {
      putInt("index", index)
      putDouble("position", position.toDouble())
      putDouble("detent", detent.toDouble())
    }

  companion object {
    const val EVENT_NAME = "topDidPresent"
    const val REGISTRATION_NAME = "onDidPresent"
  }
}

/**
 * Fired before the sheet is dismissed
 */
class WillDismissEvent(surfaceId: Int, viewId: Int) : Event<WillDismissEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topWillDismiss"
    const val REGISTRATION_NAME = "onWillDismiss"
  }
}

/**
 * Fired after the sheet is dismissed
 */
class DidDismissEvent(surfaceId: Int, viewId: Int) : Event<DidDismissEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap()

  companion object {
    const val EVENT_NAME = "topDidDismiss"
    const val REGISTRATION_NAME = "onDidDismiss"
  }
}
