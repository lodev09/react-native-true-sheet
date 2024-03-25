package com.lodev09.truesheet

import android.content.Context
import android.view.View
import android.widget.RelativeLayout
import com.google.android.material.bottomsheet.BottomSheetBehavior
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.google.android.material.bottomsheet.BottomSheetDialog

class TrueSheetView(context: Context): CoordinatorLayout(context) {

  private lateinit var contents: RelativeLayout
    private set
  private lateinit var behavior: BottomSheetBehavior<*>
    private set

  override fun onViewAdded(child: View?) {
    super.onViewAdded(child)

    contents = child as RelativeLayout

    behavior = BottomSheetBehavior.from(contents).apply {
      // virtually disables 'third' breakpoint
      halfExpandedRatio = 0.9999999f
      isFitToContents = true
      isHideable = true
      // default to no collapsed state
      skipCollapsed = true
      setPeekHeight(Integer.MAX_VALUE)
    }
  }
}
