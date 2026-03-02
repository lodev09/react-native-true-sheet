package com.lodev09.truesheet.utils

import android.view.View
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.core.widget.NestedScrollView

fun View.isDescendantOf(ancestor: View): Boolean {
  if (!isAttachedToWindow) return false
  var current: View? = this
  while (current != null) {
    if (current === ancestor) return true
    current = (current.parent as? View)
  }
  return false
}

fun ViewGroup.smoothScrollBy(dx: Int, dy: Int) {
  when (this) {
    is ScrollView -> smoothScrollBy(dx, dy)
    is NestedScrollView -> smoothScrollBy(dx, dy)
  }
}

fun ViewGroup.smoothScrollTo(x: Int, y: Int) {
  when (this) {
    is ScrollView -> smoothScrollTo(x, y)
    is NestedScrollView -> smoothScrollTo(x, y)
  }
}
