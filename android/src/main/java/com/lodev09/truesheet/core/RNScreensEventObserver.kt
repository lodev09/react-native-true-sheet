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

  // Only the screen that hid the sheet brings it back. An enclosing screen reappearing
  // must not reveal a sheet whose own screen is still covered inside it.
  private var disappearedScreenTag: Int = 0

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
    val tags = screenTags(view).toList()
    presenterScreenTag = tags.firstOrNull() ?: 0
    ancestorScreenTags = tags.drop(1).toSet()
  }

  override fun onEventDispatch(event: Event<*>) {
    // Only process events for the presenter screen and the screens enclosing it
    if (presenterScreenTag == 0) return
    if (event.viewTag != presenterScreenTag && event.viewTag !in ancestorScreenTags) return

    when (event.eventName) {
      "topWillDisappear" -> {
        if (disappearedScreenTag != 0) return
        disappearedScreenTag = event.viewTag
        delegate?.presenterScreenWillDisappear()
      }

      "topWillAppear" -> {
        if (event.viewTag != disappearedScreenTag) return
        disappearedScreenTag = 0
        delegate?.presenterScreenWillAppear()
      }
    }
  }

  companion object {
    private fun isScreenView(view: View): Boolean = view.javaClass.name == RN_SCREENS_VIEW_CLASS

    // Tags of the screens enclosing the view, innermost first
    private fun screenTags(view: View?): Sequence<Int> = generateSequence(view) { it.parent as? View }.filter(::isScreenView).map { it.id }

    fun findPresenterScreenTag(view: View?): Int = screenTags(view).firstOrNull() ?: 0
  }
}
