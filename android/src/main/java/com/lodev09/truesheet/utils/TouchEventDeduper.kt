package com.lodev09.truesheet.utils

import android.view.MotionEvent

/**
 * Guards a nested RootView against dispatching the same [MotionEvent] to JS twice.
 *
 * An event that no child consumes reaches both `onInterceptTouchEvent` and `onTouchEvent`,
 * so dispatching from both starts a second JS touch stream for the same gesture.
 *
 * A plain root can live with that, but the sheet's roots are nested: touches that hit no
 * React child resolve to the root's own tag, and the second stream then finds that view
 * already holding the responder, so React only asks its ancestors - handing the touch to
 * touchables outside the sheet.
 */
internal class TouchEventDeduper {
  private var downTime = Long.MIN_VALUE
  private var eventTime = Long.MIN_VALUE
  private var action = -1

  fun shouldDispatch(event: MotionEvent): Boolean {
    if (event.downTime == downTime && event.eventTime == eventTime && event.action == action) {
      return false
    }

    downTime = event.downTime
    eventTime = event.eventTime
    action = event.action
    return true
  }
}
