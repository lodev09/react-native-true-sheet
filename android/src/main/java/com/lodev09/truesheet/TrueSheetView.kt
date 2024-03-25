package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.RelativeLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.bridge.ReactContext
import com.google.android.material.bottomsheet.BottomSheetDialog

class TrueSheetView(context: ReactContext): FrameLayout(context) {

  private lateinit var contentView: View
  private lateinit var bottomSheetDialog: BottomSheetDialog

  override fun onViewAdded(child: View?) {
    super.onViewAdded(child)
    if (child != null) {
      removeView(child)
      bottomSheetDialog = BottomSheetDialog(context)
      bottomSheetDialog.setContentView(child)
    }
  }

  fun present() {
    bottomSheetDialog.show()
  }

  fun dismiss() {
    bottomSheetDialog.dismiss()
  }
}
