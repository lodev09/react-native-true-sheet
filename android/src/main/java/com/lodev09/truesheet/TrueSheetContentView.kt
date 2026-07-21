package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ScrollView
import androidx.core.widget.NestedScrollView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup
import com.lodev09.truesheet.core.TrueSheetKeyboardObserver
import com.lodev09.truesheet.core.TrueSheetKeyboardObserverDelegate
import com.lodev09.truesheet.utils.isDescendantOf
import com.lodev09.truesheet.utils.smoothScrollBy
import com.lodev09.truesheet.utils.smoothScrollTo

data class ScrollableOptions(val keyboardScrollOffset: Float = 0f, val scrollingExpandsSheet: Boolean = true)

/**
 * Delegate interface for content view size changes
 */
interface TrueSheetContentViewDelegate {
  fun contentViewDidChangeSize(width: Int, height: Int)
  fun contentViewDidScroll()
  fun contentViewScrollViewDidChange()

  /**
   * Keyboard occlusion adjustment below the content — positive for an absolute
   * footer risen above the keyboard covering the content's bottom edge,
   * negative for a relative footer sitting behind the keyboard shielding it.
   */
  val footerKeyboardOcclusion: Int
}

/**
 * Content view that holds the main sheet content
 * This is the first child of TrueSheetContainerView
 */
@SuppressLint("ViewConstructor")
class TrueSheetContentView(private val reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {
  var delegate: TrueSheetContentViewDelegate? = null
  var stateWrapper: StateWrapper? = null

  private var lastWidth = 0
  private var lastHeight = 0

  private var pinnedScrollView: ViewGroup? = null
  private var observedScrollChild: View? = null
  private var originalScrollViewPaddingBottom: Int = 0
  private var bottomInset: Int = 0
  private var scrollableBounded = false
  private var isReportPending = false

  // Content growth is invisible to layout once the viewport is bounded, so track
  // the scroll content size directly to keep the auto detent height in sync.
  private val scrollChildLayoutListener =
    View.OnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
      if (bottom - top != oldBottom - oldTop) {
        reportSizeIfChanged()
      }
    }

  /**
   * Content height with the pinned ScrollView's viewport replaced by its content
   * size — the height the content wants regardless of container bounds.
   * Falls back to the view height when no ScrollView is pinned.
   */
  val naturalHeight: Int
    get() {
      var naturalHeight = height
      pinnedScrollView?.let { scrollView ->
        scrollView.getChildAt(0)?.let { child ->
          naturalHeight += child.height - scrollView.height
        }
      }
      return maxOf(0, naturalHeight)
    }

  private var keyboardScrollOffset: Float = 0f
  private var keyboardObserver: TrueSheetKeyboardObserver? = null

  private var watchedEditText: EditText? = null
  private var caretTextWatcher: TextWatcher? = null

  var scrollableOptions: ScrollableOptions? = null
    set(value) {
      field = value
      keyboardScrollOffset = value?.keyboardScrollOffset?.dpToPx() ?: 0f
    }

  /**
   * Whether the sheet has an `auto` detent. Deriving the sheet height from the
   * scroll content is circular with natural layout, so the pinned ScrollView's
   * viewport is force-bounded to the container only in this case.
   */
  var hasAutoDetent = false
    set(value) {
      if (field == value) return
      field = value
      if (pinnedScrollView != null) {
        setScrollableBounded(value)
      }
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
    reportSizeIfChanged()
  }

  private fun reportSizeIfChanged() {
    // naturalHeight mixes sizes from different views; mid-layout they're
    // momentarily inconsistent (parent resizes before its children), which
    // feeds back into the auto detent and oscillates. Coalesce to the next
    // frame so sizes are settled before measuring.
    if (pinnedScrollView != null) {
      if (isReportPending) return
      isReportPending = true

      post {
        isReportPending = false
        reportSizeNow()
      }
      return
    }

    reportSizeNow()
  }

  private fun reportSizeNow() {
    val newHeight = naturalHeight
    if (width != lastWidth || newHeight != lastHeight) {
      lastWidth = width
      lastHeight = newHeight
      delegate?.contentViewDidChangeSize(width, newHeight)
    }
  }

  /**
   * Tells the shadow node to fill the container (flexGrow/flexShrink) so the
   * pinned ScrollView's viewport is bounded to the visible space. Only applied
   * for auto detents — otherwise content lays out naturally like a regular view.
   */
  private fun setScrollableBounded(bounded: Boolean) {
    if (scrollableBounded == bounded) return
    scrollableBounded = bounded

    stateWrapper?.let {
      val newState = WritableNativeMap()
      newState.putBoolean("scrollableBounded", bounded)
      it.updateState(newState)
    }
  }

  fun setupScrollable(bottomInset: Int) {
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

      scrollView.getChildAt(0)?.let { child ->
        observedScrollChild = child
        child.addOnLayoutChangeListener(scrollChildLayoutListener)
      }
      setScrollableBounded(hasAutoDetent)
      reportSizeIfChanged()
    }

    this.bottomInset = bottomInset

    setScrollViewPaddingBottom(originalScrollViewPaddingBottom + bottomInset)

    // If keyboard is currently showing, re-apply the keyboard inset to the new ScrollView
    val keyboardHeight = keyboardObserver?.currentHeight ?: 0
    if (keyboardHeight > 0) {
      updateScrollViewInsetForKeyboard(keyboardHeight)
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
    pinnedScrollView?.isNestedScrollingEnabled = false
    (pinnedScrollView?.parent as? SwipeRefreshLayout)?.isNestedScrollingEnabled = true
    setScrollViewPaddingBottom(originalScrollViewPaddingBottom)
    observedScrollChild?.removeOnLayoutChangeListener(scrollChildLayoutListener)
    observedScrollChild = null
    setScrollableBounded(false)
    pinnedScrollView = null
    originalScrollViewPaddingBottom = 0
    bottomInset = 0
    reportSizeIfChanged()
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
          attachCaretListener()
          scrollToFocusedInput()
        }

        override fun keyboardWillHide() {
          detachCaretListener()
          updateScrollViewInsetForKeyboard(0)
        }

        override fun focusDidChange(newFocus: View) {
          attachCaretListener()
          scrollToFocusedInput()
        }
      }
      start()
    }
  }

  fun cleanupKeyboardHandler() {
    detachCaretListener()
    keyboardObserver?.stop()
    keyboardObserver = null
  }

  private fun attachCaretListener() {
    val focused = findFocus() as? EditText
    if (focused === watchedEditText) return

    detachCaretListener()
    if (focused == null) return

    val watcher = object : TextWatcher {
      override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
      override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
      override fun afterTextChanged(s: Editable?) {
        focused.post { scrollToFocusedInput() }
      }
    }

    focused.addTextChangedListener(watcher)
    watchedEditText = focused
    caretTextWatcher = watcher
  }

  private fun detachCaretListener() {
    caretTextWatcher?.let { watchedEditText?.removeTextChangedListener(it) }
    caretTextWatcher = null
    watchedEditText = null
  }

  private fun updateScrollViewInsetForKeyboard(keyboardHeight: Int) {
    val scrollView = pinnedScrollView ?: return

    // An absolute footer rises above the keyboard and covers the content's
    // bottom edge — include it so the caret clears the footer, not just the
    // keyboard. A relative footer stays behind the keyboard below the content,
    // so its height shields that much of the keyboard's overlap.
    val totalBottomInset = if (keyboardHeight > 0) {
      maxOf(0, keyboardHeight + (delegate?.footerKeyboardOcclusion ?: 0))
    } else {
      bottomInset
    }
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

    val viewTop = focusedLocation[1] - scrollViewLocation[1] + scrollView.scrollY

    // Resolve the caret's line within the focused input so we follow the cursor
    // rather than the input's full bounds (which over-scrolls tall inputs).
    val editText = focusedView as? EditText
    val layout = editText?.layout

    val caretTop: Int
    val caretBottom: Int
    if (editText != null && layout != null) {
      val line = layout.getLineForOffset(editText.selectionEnd.coerceAtLeast(0))
      val textTop = viewTop + editText.totalPaddingTop - editText.scrollY
      caretTop = textTop + layout.getLineTop(line)
      caretBottom = textTop + layout.getLineBottom(line)
    } else {
      caretTop = viewTop
      caretBottom = viewTop + focusedView.height
    }

    val offset = keyboardScrollOffset.toInt()
    val visibleHeight = scrollView.height - scrollView.paddingBottom
    val visibleTop = scrollView.scrollY
    val visibleBottom = scrollView.scrollY + visibleHeight

    when {
      caretBottom + offset > visibleBottom ->
        scrollView.smoothScrollTo(0, caretBottom + offset - visibleHeight)

      caretTop - offset < visibleTop ->
        scrollView.smoothScrollTo(0, (caretTop - offset).coerceAtLeast(0))
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
