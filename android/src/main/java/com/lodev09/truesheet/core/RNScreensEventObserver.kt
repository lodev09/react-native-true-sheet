package com.lodev09.truesheet.core

import android.view.View
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.EventDispatcherListener

private const val RN_SCREENS_VIEW_CLASS = "com.swmansion.rnscreens.Screen"

interface RNScreensEventObserverDelegate {
  fun presenterScreenWillDisappear()
  fun presenterScreenWillAppear()
}

/**
 * Observes react-native-screens lifecycle events via EventDispatcherListener.
 * Detects when the presenting screen unmounts while sheet is presented.
 */
class RNScreensEventObserver : EventDispatcherListener {
  var delegate: RNScreensEventObserverDelegate? = null

  private var eventDispatcher: EventDispatcher? = null
  var presenterScreenTag: Int = 0

  // Screens enclosing the presenter. react-native-screens only dispatches lifecycle
  // events for stack screens, so a presenter inside a plain screen container (e.g. a
  // bottom tab) never receives them and an enclosing stack screen has to stand in.
  var ancestorScreenTags: Set<Int> = emptySet()

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
    val ancestors = mutableSetOf<Int>()

    var current: View? = view
    while (current != null) {
      if (isScreenView(current)) {
        if (presenterScreenTag == 0) {
          presenterScreenTag = current.id
        } else {
          ancestors.add(current.id)
        }
      }
      current = (current.parent as? View)
    }

    ancestorScreenTags = ancestors
  }

  override fun onEventDispatch(event: Event<*>) {
    // Only process events for the presenter screen
    if (presenterScreenTag == 0) return
    if (event.viewTag != presenterScreenTag && event.viewTag !in ancestorScreenTags) return

    when (event.eventName) {
      "topWillDisappear" -> delegate?.presenterScreenWillDisappear()
      "topWillAppear" -> delegate?.presenterScreenWillAppear()
    }
  }

  companion object {
    private fun isScreenView(view: View): Boolean = view.javaClass.name == RN_SCREENS_VIEW_CLASS
  }
}
