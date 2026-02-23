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
import com.lodev09.truesheet.utils.isDescendantOf

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

  init {
    // Detect when children are added/removed (e.g. conditional ScrollView remount).
    setOnHierarchyChangeListener(object : OnHierarchyChangeListener {
      override fun onChildViewAdded(parent: View?, child: View?) {
        checkScrollViewChanged()
      }

      override fun onChildViewRemoved(parent: View?, child: View?) {
        checkScrollViewChanged()
      }
    })
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

  private fun setScrollViewPaddingBottom(paddingBottom: Int) {
    val scrollView = pinnedScrollView ?: return
    scrollView.clipToPadding = false
    scrollView.setPadding(
      scrollView.paddingLeft,
      scrollView.paddingTop,
      scrollView.paddingRight,
      paddingBottom
    )
  }

  fun clearScrollable() {
    pinnedScrollView?.setOnScrollChangeListener(null as View.OnScrollChangeListener?)
    setScrollViewPaddingBottom(originalScrollViewPaddingBottom)
    pinnedScrollView = null
    originalScrollViewPaddingBottom = 0
    bottomInset = 0
  }

  fun findScrollView(): ScrollView? {
    if (pinnedScrollView != null) return pinnedScrollView
    return findScrollView(this as View)
  }

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
