package com.lodev09.truesheet.utils

import android.view.View

fun View.isDescendantOf(ancestor: View): Boolean {
  var current: View? = this
  while (current != null) {
    if (current === ancestor) return true
    current = (current.parent as? View)
  }
  return false
}
