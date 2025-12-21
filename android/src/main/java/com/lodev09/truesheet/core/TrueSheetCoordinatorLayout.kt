package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactPointerEventsView

interface TrueSheetCoordinatorLayoutDelegate {
  fun coordinatorLayoutDidLayout(changed: Boolean)
}

/**
 * Custom CoordinatorLayout that hosts the bottom sheet and dim view.
 * Implements ReactPointerEventsView to allow touch events to pass through
 * to underlying React Native views when appropriate.
 */
@SuppressLint("ViewConstructor")
class TrueSheetCoordinatorLayout(context: Context) :
  CoordinatorLayout(context),
  ReactPointerEventsView {

  var delegate: TrueSheetCoordinatorLayoutDelegate? = null

  init {
    // Fill the entire screen
    layoutParams = LayoutParams(
      LayoutParams.MATCH_PARENT,
      LayoutParams.MATCH_PARENT
    )

    // Ensure we don't clip the sheet during animations
    clipChildren = false
    clipToPadding = false
  }

  override fun onLayout(
    changed: Boolean,
    l: Int,
    t: Int,
    r: Int,
    b: Int
  ) {
    super.onLayout(changed, l, t, r, b)
    delegate?.coordinatorLayoutDidLayout(changed)
  }

  /**
   * Allow pointer events to pass through to underlying views.
   * The DimView and BottomSheetView handle their own touch interception.
   */
  override val pointerEvents: PointerEvents
    get() = PointerEvents.BOX_NONE
}
