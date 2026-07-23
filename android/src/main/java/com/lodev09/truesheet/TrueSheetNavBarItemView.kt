package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Bar item view re-parented into the nav bar's toolbar.
 * RN/Yoga computes its size, but the toolbar owns its position — onMeasure
 * reports the size captured from React's mount pass so the toolbar's own
 * measure pass doesn't collapse it.
 */
@SuppressLint("ViewConstructor")
class TrueSheetNavBarItemView(context: ThemedReactContext) : ReactViewGroup(context) {

  enum class SlotType {
    LEFT,
    RIGHT,
    TITLE;

    companion object {
      fun fromString(value: String?): SlotType =
        when (value) {
          "right" -> RIGHT
          "title" -> TITLE
          else -> LEFT
        }
    }
  }

  var navBar: TrueSheetNavBarView? = null

  var slotType: SlotType = SlotType.LEFT
    set(value) {
      if (field == value) return
      field = value
      navBar?.itemSlotDidChange(this)
    }

  private var reactWidth = 0
  private var reactHeight = 0

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    if (MeasureSpec.getMode(widthMeasureSpec) == MeasureSpec.EXACTLY &&
      MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.EXACTLY
    ) {
      // Exact specs come from React's mount pass — capture the Yoga-computed
      // size and have the toolbar re-layout with it
      reactWidth = MeasureSpec.getSize(widthMeasureSpec)
      reactHeight = MeasureSpec.getSize(heightMeasureSpec)
      (parent as? View)?.let {
        forceLayout()
        it.requestLayout()
      }
    }
    setMeasuredDimension(reactWidth, reactHeight)
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
