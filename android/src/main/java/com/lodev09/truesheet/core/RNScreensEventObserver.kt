package com.lodev09.truesheet.core

import android.view.View
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.EventDispatcherListener

private const val RN_SCREENS_VIEW_CLASS = "com.swmansion.rnscreens.Screen"

interface RNScreensEventObserverDelegate {
  fun screenWillDisappear()
  fun screenWillAppear()
}

/**
 * Observes react-native-screens lifecycle events via EventDispatcherListener.
 * Detects when the presenting screen unmounts while sheet is presented.
 */
class RNScreensEventObserver : EventDispatcherListener {
  var delegate: RNScreensEventObserverDelegate? = null

  private var eventDispatcher: EventDispatcher? = null
  private var presenterScreenTag: Int = 0

  fun startObserving(dispatcher: EventDispatcher?) {
    if (eventDispatcher != null || dispatcher == null) return

    eventDispatcher = dispatcher
    dispatcher.addListener(this)
  }

  fun stopObserving() {
    eventDispatcher?.removeListener(this)
    eventDispatcher = null
  }

  fun capturePresenterScreenFromView(view: View?) {
    presenterScreenTag = 0

    var current: View? = view
    while (current != null) {
      if (isScreenView(current)) {
        presenterScreenTag = current.id
        break
      }
      current = (current.parent as? View)
    }
  }

  override fun onEventDispatch(event: Event<*>) {
    // Only process events for the presenter screen
    if (presenterScreenTag == 0 || event.viewTag != presenterScreenTag) return

    when (event.eventName) {
      "topWillDisappear" -> delegate?.screenWillDisappear()
      "topWillAppear" -> delegate?.screenWillAppear()
    }
  }

  companion object {
    private fun isScreenView(view: View): Boolean {
      return view.javaClass.name == RN_SCREENS_VIEW_CLASS
    }
  }
}
