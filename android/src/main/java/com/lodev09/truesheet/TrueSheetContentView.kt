package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewGroup

import android.widget.ScrollView
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup
import com.lodev09.truesheet.core.TrueSheetKeyboardObserver
import com.lodev09.truesheet.core.TrueSheetKeyboardObserverDelegate

/**
 * Delegate interface for content view size changes
 */
interface TrueSheetContentViewDelegate {
  fun contentViewDidChangeSize(width: Int, height: Int)
}

/**
 * Content view that holds the main sheet content
 * This is the first child of TrueSheetContainerView
 */
@SuppressLint("ViewConstructor")
class TrueSheetContentView(private val reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {
  var delegate: TrueSheetContentViewDelegate? = null

  private var lastWidth = 0
  private var lastHeight = 0

  private var pinnedScrollView: ScrollView? = null
  private var originalScrollViewPaddingBottom: Int = 0
  private var bottomInset: Int = 0

  private var keyboardScrollOffset: Float = 0f
  private var keyboardObserver: TrueSheetKeyboardObserver? = null

  var scrollableOptions: ReadableMap? = null
    set(value) {
      field = value
      keyboardScrollOffset = value?.getDouble("keyboardScrollOffset")?.toFloat()?.dpToPx() ?: 0f
    }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w != lastWidth || h != lastHeight) {
      lastWidth = w
      lastHeight = h
      delegate?.contentViewDidChangeSize(w, h)
    }
  }

  fun setupScrollViewPinning(enabled: Boolean, bottomInset: Int) {
    if (!enabled) {
      clearScrollViewPinning()
      return
    }

    this.bottomInset = bottomInset
    applyScrollViewBottomInset()
  }

  private fun applyScrollViewBottomInset() {
    val scrollView = findScrollView(this)

    if (scrollView != pinnedScrollView) {
      // Restore previous scroll view's padding
      pinnedScrollView?.setPadding(
        pinnedScrollView!!.paddingLeft,
        pinnedScrollView!!.paddingTop,
        pinnedScrollView!!.paddingRight,
        originalScrollViewPaddingBottom
      )

      pinnedScrollView = scrollView
      originalScrollViewPaddingBottom = scrollView?.paddingBottom ?: 0
    }

    scrollView?.let {
      it.clipToPadding = false
      it.setPadding(
        it.paddingLeft,
        it.paddingTop,
        it.paddingRight,
        originalScrollViewPaddingBottom + bottomInset
      )
    }
  }

  fun clearScrollViewPinning() {
    pinnedScrollView?.setPadding(
      pinnedScrollView!!.paddingLeft,
      pinnedScrollView!!.paddingTop,
      pinnedScrollView!!.paddingRight,
      originalScrollViewPaddingBottom
    )
    pinnedScrollView = null
    originalScrollViewPaddingBottom = 0
    bottomInset = 0
  }

  fun findScrollView(): ScrollView? = findScrollView(this)

  private fun findScrollView(view: View): ScrollView? {
    if (view is ScrollView) {
      return view
    }

    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val scrollView = findScrollView(view.getChildAt(i))
        if (scrollView != null) {
          return scrollView
        }
      }
    }

    return null
  }

  // ==================== Keyboard Handling ====================

  fun setupKeyboardHandler() {
    if (keyboardObserver != null) return

    keyboardObserver = TrueSheetKeyboardObserver(this, reactContext).apply {
      delegate = object : TrueSheetKeyboardObserverDelegate {
        override fun keyboardWillShow(height: Int) {
          updateScrollViewInsetForKeyboard(height)
        }

        override fun keyboardDidShow(height: Int) {
          scrollToFocusedInput()
        }

        override fun keyboardWillHide() {
          updateScrollViewInsetForKeyboard(0)
        }

        override fun keyboardDidHide() { }
        override fun keyboardDidChangeHeight(height: Int) { }
        override fun focusDidChange(newFocus: View) {
          scrollToFocusedInput()
        }
      }
      start()
    }
  }

  fun cleanupKeyboardHandler() {
    keyboardObserver?.stop()
    keyboardObserver = null
  }

  private fun updateScrollViewInsetForKeyboard(keyboardHeight: Int) {
    val scrollView = pinnedScrollView ?: return

    val totalBottomInset = if (keyboardHeight > 0) keyboardHeight else bottomInset
    val newPaddingBottom = originalScrollViewPaddingBottom + totalBottomInset

    scrollView.clipToPadding = false
    scrollView.setPadding(
      scrollView.paddingLeft,
      scrollView.paddingTop,
      scrollView.paddingRight,
      newPaddingBottom
    )

    // Trigger a scroll to force update
    scrollView.post {
      scrollView.smoothScrollBy(0, 1)
      scrollView.smoothScrollBy(0, -1)
    }
  }

  private fun scrollToFocusedInput() {
    val scrollView = pinnedScrollView ?: findScrollView() ?: return
    val focusedView = findFocus() ?: return

    val focusedLocation = IntArray(2)
    val scrollViewLocation = IntArray(2)
    focusedView.getLocationOnScreen(focusedLocation)
    scrollView.getLocationOnScreen(scrollViewLocation)

    val relativeTop = focusedLocation[1] - scrollViewLocation[1] + scrollView.scrollY
    val relativeBottom = relativeTop + focusedView.height + keyboardScrollOffset.toInt()

    val visibleHeight = scrollView.height - scrollView.paddingBottom
    val visibleBottom = scrollView.scrollY + visibleHeight

    if (relativeBottom > visibleBottom) {
      scrollView.smoothScrollTo(0, relativeBottom - visibleHeight)
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
