package com.lodev09.truesheet.utils

import android.view.View
import android.view.ViewGroup
import android.view.ViewParent
import android.widget.ScrollView
import androidx.core.widget.NestedScrollView
import com.facebook.react.uimanager.ThemedReactContext

fun View.isDescendantOf(ancestor: View): Boolean {
  if (!isAttachedToWindow) return false
  var current: View? = this
  while (current != null) {
    if (current === ancestor) return true
    current = (current.parent as? View)
  }
  return false
}

fun ViewGroup.smoothScrollTo(x: Int, y: Int) {
  when (this) {
    is ScrollView -> smoothScrollTo(x, y)
    is NestedScrollView -> smoothScrollTo(x, y)
  }
}

/**
 * The content view hosting this view — the activity's, or a Modal dialog's.
 * Window-level views (sheet coordinators, overlays) attach here.
 */
fun View.findRootContainerView(reactContext: ThemedReactContext): ViewGroup? {
  var current: ViewParent? = parent

  while (current != null) {
    if (current is ViewGroup && current.id == android.R.id.content) {
      return current
    }
    current = current.parent
  }

  return reactContext.currentActivity?.findViewById(android.R.id.content)
}
