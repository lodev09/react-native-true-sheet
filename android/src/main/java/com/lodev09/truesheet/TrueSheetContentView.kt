package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewGroup
import android.widget.ScrollView
import androidx.core.widget.NestedScrollView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup
import com.lodev09.truesheet.core.TrueSheetKeyboardObserver
import com.lodev09.truesheet.core.TrueSheetKeyboardObserverDelegate
import com.lodev09.truesheet.utils.isDescendantOf
import com.lodev09.truesheet.utils.smoothScrollBy
import com.lodev09.truesheet.utils.smoothScrollTo

/**
 * Delegate interface for content view size changes
 */
interface TrueSheetContentViewDelegate {
  fun contentViewDidChangeSize(width: Int, height: Int)
  fun contentViewDidScroll()
  fun contentViewScrollViewDidChange()
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

  private var pinnedScrollView: ViewGroup? = null
  private var originalScrollViewPaddingBottom: Int = 0
  private var bottomInset: Int = 0
  private var scrollExpansionPadding: Int = 0

  private var keyboardScrollOffset: Float = 0f
  private var keyboardObserver: TrueSheetKeyboardObserver? = null

  var scrollableOptions: ReadableMap? = null
    set(value) {
      field = value
      keyboardScrollOffset = if (value?.hasKey("keyboardScrollOffset") == true) value.getDouble("keyboardScrollOffset").toFloat().dpToPx() else 0f
    }

  override fun addView(child: View?, index: Int) {
    super.addView(child, index)
    checkScrollViewChanged()
  }

  override fun removeViewAt(index: Int) {
    super.removeViewAt(index)
    checkScrollViewChanged()
  }

  private fun checkScrollViewChanged() {
    if (pinnedScrollView == null || pinnedScrollView?.isDescendantOf(this) == false) {
      delegate?.contentViewScrollViewDidChange()
    }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w != lastWidth || h != lastHeight) {
      lastWidth = w
      lastHeight = h
      delegate?.contentViewDidChangeSize(w, h)
    }
  }

  fun setupScrollable(enabled: Boolean, bottomInset: Int) {
    if (!enabled) {
      clearScrollable()
      return
    }

    // Check if pinned scroll view is still valid (still in view hierarchy)
    if (pinnedScrollView != null && pinnedScrollView?.isDescendantOf(this) == false) {
      clearScrollable()
    }

    // Already set up with same inset and valid scroll view
    if (pinnedScrollView != null && this.bottomInset == bottomInset) {
      return
    }

    val scrollView = findScrollView(this) ?: return

    // Only capture originals on first pin
    if (pinnedScrollView == null) {
      originalScrollViewPaddingBottom = scrollView.paddingBottom
      pinnedScrollView = scrollView

      scrollView.isNestedScrollingEnabled = true
      (scrollView.parent as? SwipeRefreshLayout)?.isNestedScrollingEnabled = false

      scrollView.setOnScrollChangeListener { _, _, scrollY, _, oldScrollY ->
        if (scrollY != oldScrollY) {
          delegate?.contentViewDidScroll()
        }
      }
    }

    this.bottomInset = bottomInset

    setScrollViewPaddingBottom(originalScrollViewPaddingBottom + bottomInset)

    // If keyboard is currently showing, re-apply the keyboard inset to the new ScrollView
    val keyboardHeight = keyboardObserver?.currentHeight ?: 0
    if (keyboardHeight > 0) {
      setScrollViewPaddingBottom(originalScrollViewPaddingBottom + keyboardHeight)
    }
  }

  // TODO: Replace this workaround with synchronous state layout updates on every sheet resize.
  // The container is currently sized to the largest detent, so at smaller detents the ScrollView
  // viewport extends beyond the visible area, reducing the effective scroll range. This padding
  // compensates for that difference until we can resize the container per-detent synchronously.
  fun updateScrollExpansionPadding(padding: Int) {
    if (scrollExpansionPadding == padding) return
    scrollExpansionPadding = padding
    val keyboardHeight = keyboardObserver?.currentHeight ?: 0
    val basePadding = if (keyboardHeight > 0) keyboardHeight else bottomInset
    setScrollViewPaddingBottom(originalScrollViewPaddingBottom + basePadding)
    nudgeScrollView()
  }

  private fun setScrollViewPaddingBottom(paddingBottom: Int) {
    val scrollView = pinnedScrollView ?: return
    scrollView.clipToPadding = false
    scrollView.setPadding(
      scrollView.paddingLeft,
      scrollView.paddingTop,
      scrollView.paddingRight,
      paddingBottom + scrollExpansionPadding
    )
  }

  fun clearScrollable() {
    pinnedScrollView?.setOnScrollChangeListener(null as View.OnScrollChangeListener?)
    pinnedScrollView?.isNestedScrollingEnabled = false
    (pinnedScrollView?.parent as? SwipeRefreshLayout)?.isNestedScrollingEnabled = true
    scrollExpansionPadding = 0
    setScrollViewPaddingBottom(originalScrollViewPaddingBottom)
    pinnedScrollView = null
    originalScrollViewPaddingBottom = 0
    bottomInset = 0
  }

  fun findScrollView(): ViewGroup? {
    if (pinnedScrollView != null) return pinnedScrollView
    return findScrollView(this as View)
  }

  private fun findScrollView(view: View): ViewGroup? {
    if (view is ScrollView || view is NestedScrollView) {
      return view as ViewGroup
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
    setScrollViewPaddingBottom(originalScrollViewPaddingBottom + totalBottomInset)

    scrollView.post { nudgeScrollView() }
  }

  private fun nudgeScrollView() {
    val scrollView = pinnedScrollView ?: return
    scrollView.smoothScrollBy(0, 1)
    scrollView.smoothScrollBy(0, -1)
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
