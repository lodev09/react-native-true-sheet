package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.os.Build
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup
import com.lodev09.truesheet.core.TrueSheetKeyboardObserver
import com.lodev09.truesheet.core.TrueSheetKeyboardObserverDelegate
import com.lodev09.truesheet.utils.isDescendantOf
import com.lodev09.truesheet.utils.smoothScrollTo

data class ScrollableOptions(
  val keyboardScrollOffset: Float = 0f,
  val keyboardOffset: Float = 0f,
  val scrollingExpandsSheet: Boolean = true,
  val contentInsetAdjustment: Boolean = true
)

/**
 * Delegate interface for content view size changes
 */
interface TrueSheetContentViewDelegate {
  fun contentViewDidChangeSize(width: Int, height: Int)
  fun contentViewDidScroll()
  fun contentViewScrollViewDidChange()

  /**
   * Keyboard occlusion adjustment below the content — positive for an absolute
   * footer floating over the viewport's bottom edge (extends the caret reveal),
   * negative for a relative footer sitting behind the keyboard shielding that
   * much of its overlap (reduces the keyboard padding).
   */
  val footerKeyboardOcclusion: Int

  /**
   * A relative footer sits below the content and absorbs the bottom safe-area
   * inset — the scrollable doesn't reach the sheet's bottom edge, so no
   * content inset is applied (mirrors iOS, where UIKit resolves this
   * geometrically via the scroll view's safe area).
   */
  val hasRelativeFooter: Boolean
}

/**
 * Content view that holds the main sheet content
 * This is the first child of TrueSheetContainerView
 */
@SuppressLint("ViewConstructor")
class TrueSheetContentView(private val reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {
  var delegate: TrueSheetContentViewDelegate? = null
  var stateWrapper: StateWrapper? = null

  private var detectedScrollView: ViewGroup? = null
  private var originalScrollViewPaddingBottom: Int = 0
  private var scrollableBounded = false

  /**
   * Content height measured unconstrained by the shadow node — the height the
   * content wants regardless of container bounds (see
   * TrueSheetContentViewShadowNode). Falls back to the view height before the
   * first state update.
   */
  val naturalHeight: Int
    get() = if (lastNaturalHeight > 0) lastNaturalHeight else height

  private var lastNaturalHeight = 0

  fun updateNaturalHeight(heightDp: Double) {
    val heightPx = heightDp.toFloat().dpToPx().toInt()
    if (heightPx == lastNaturalHeight) return
    lastNaturalHeight = heightPx
    delegate?.contentViewDidChangeSize(width, heightPx)
  }

  private var keyboardScrollOffset: Float = 0f

  /**
   * Adjustment added to the keyboard bottom inset applied to the detected
   * scrollable — negative values reduce the inset (e.g. to cancel out safe-area
   * padding already baked into the content's paddingBottom).
   */
  private var keyboardOffset: Float = 0f

  /**
   * How much of keyboardOffset actually landed in the applied padding — the
   * caret reveal compensates by this so it still targets the real keyboard edge.
   */
  private var appliedKeyboardOffset = 0

  private var keyboardObserver: TrueSheetKeyboardObserver? = null

  private var watchedEditText: EditText? = null
  private var caretTextWatcher: TextWatcher? = null

  var scrollableOptions: ScrollableOptions? = null
    set(value) {
      field = value
      keyboardScrollOffset = value?.keyboardScrollOffset?.dpToPx() ?: 0f
      keyboardOffset = value?.keyboardOffset?.dpToPx() ?: 0f
      updateContentInset()
    }

  /**
   * Bottom safe-area inset applied to the scrollable's content padding while
   * the content can scroll — Android counterpart of iOS's
   * `contentInsetAdjustmentBehavior="automatic"`. Already zero when the
   * sheet's `insetAdjustment` is `'never'`.
   */
  var bottomInset: Int = 0
    set(value) {
      if (field == value) return
      field = value
      updateContentInset()
    }

  private var baseBottomInset = 0
  private var keyboardBottomInset = 0

  private val scrollableLayoutListener =
    View.OnLayoutChangeListener { _, _, top, _, bottom, _, oldTop, _, oldBottom ->
      if (bottom - top != oldBottom - oldTop) updateContentInset()
    }

  /**
   * React tag of the user-provided scrollable (see the `scrollableRef` prop).
   * Setting a new handle clears the currently resolved ScrollView.
   */
  var scrollableHandle: Int = -1
    set(value) {
      if (field == value) return
      field = value
      clearScrollable()
    }

  /**
   * Whether the sheet has an `auto` detent. Deriving the sheet height from the
   * scroll content is circular with natural layout, so the detected ScrollView's
   * viewport is force-bounded to the container only in this case.
   */
  var hasAutoDetent = false
    set(value) {
      if (field == value) return
      field = value
      if (detectedScrollView != null) {
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
    if (detectedScrollView == null || detectedScrollView?.isDescendantOf(this) == false) {
      delegate?.contentViewScrollViewDidChange()
    }
  }

  /**
   * Tells the shadow node to fill the container (flexGrow/flexShrink) so the
   * detected ScrollView's viewport is bounded to the visible space. Only applied
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

  fun setupScrollable() {
    // Check if the detected scroll view is still valid (still in view hierarchy)
    if (detectedScrollView != null && detectedScrollView?.isDescendantOf(this) == false) {
      clearScrollable()
    }

    if (detectedScrollView != null) {
      return
    }

    val scrollView = findScrollView() ?: return

    originalScrollViewPaddingBottom = scrollView.paddingBottom
    detectedScrollView = scrollView

    scrollView.isNestedScrollingEnabled = true
    (scrollView.parent as? SwipeRefreshLayout)?.isNestedScrollingEnabled = false

    scrollView.setOnScrollChangeListener { _, _, scrollY, _, oldScrollY ->
      if (scrollY != oldScrollY) {
        delegate?.contentViewDidScroll()
      }
    }

    // Track viewport and content size changes — the content inset only applies
    // while the content can scroll (mirrors iOS's automatic behavior)
    scrollView.addOnLayoutChangeListener(scrollableLayoutListener)
    scrollView.getChildAt(0)?.addOnLayoutChangeListener(scrollableLayoutListener)

    setScrollableBounded(hasAutoDetent)
    updateContentInset()

    // If keyboard is currently showing, re-apply the keyboard inset to the new ScrollView
    val keyboardHeight = keyboardObserver?.currentHeight ?: 0
    if (keyboardHeight > 0) {
      updateScrollViewInsetForKeyboard(keyboardHeight)
    }
  }

  /**
   * Re-applies the base content inset — the bottom safe-area inset while the
   * content can scroll, no relative footer absorbs it, and
   * `contentInsetAdjustmentBehavior` isn't disabled.
   */
  fun updateContentInset() {
    val scrollView = detectedScrollView ?: return

    val enabled = scrollableOptions?.contentInsetAdjustment ?: true
    baseBottomInset = if (enabled && delegate?.hasRelativeFooter != true && canScrollContent(scrollView)) {
      bottomInset
    } else {
      0
    }

    applyBottomPadding()
  }

  // Measured against the original padding so the applied inset doesn't feed
  // back into the check
  private fun canScrollContent(scrollView: ViewGroup): Boolean {
    val child = scrollView.getChildAt(0) ?: return false
    return child.height > scrollView.height - scrollView.paddingTop - originalScrollViewPaddingBottom
  }

  // The keyboard covers the safe-area region, so the larger inset wins over a sum
  private fun applyBottomPadding() {
    setScrollViewPaddingBottom(originalScrollViewPaddingBottom + maxOf(baseBottomInset, keyboardBottomInset))
  }

  private fun setScrollViewPaddingBottom(paddingBottom: Int) {
    val scrollView = detectedScrollView ?: return
    scrollView.clipToPadding = false
    scrollView.setPadding(
      scrollView.paddingLeft,
      scrollView.paddingTop,
      scrollView.paddingRight,
      paddingBottom
    )
  }

  fun clearScrollable() {
    detectedScrollView?.setOnScrollChangeListener(null as View.OnScrollChangeListener?)
    detectedScrollView?.removeOnLayoutChangeListener(scrollableLayoutListener)
    detectedScrollView?.getChildAt(0)?.removeOnLayoutChangeListener(scrollableLayoutListener)
    detectedScrollView?.isNestedScrollingEnabled = false
    (detectedScrollView?.parent as? SwipeRefreshLayout)?.isNestedScrollingEnabled = true
    setScrollViewPaddingBottom(originalScrollViewPaddingBottom)
    setScrollableBounded(false)
    detectedScrollView = null
    originalScrollViewPaddingBottom = 0
    baseBottomInset = 0
    keyboardBottomInset = 0
    appliedKeyboardOffset = 0
  }

  /**
   * Resolves the user-provided `scrollableHandle` within the content subtree —
   * React tags are view ids on Android.
   */
  fun findScrollView(): ViewGroup? {
    if (detectedScrollView != null) return detectedScrollView
    if (scrollableHandle <= 0) return null
    return findViewById<View>(scrollableHandle) as? ViewGroup
  }

  // ==================== Keyboard Handling ====================

  fun setupKeyboardHandler() {
    if (keyboardObserver != null) return

    keyboardObserver = TrueSheetKeyboardObserver(this, reactContext).apply {
      delegate = object : TrueSheetKeyboardObserverDelegate {
        // Drive the inset per keyboard animation frame so the content tracks
        // the keyboard edge instead of jumping to the final inset up front.
        // On hide, the shrinking inset gradually clamps the scroll position
        // back in sync with the keyboard.
        override fun keyboardDidChangeHeight(height: Int) {
          updateScrollViewInsetForKeyboard(height)

          // Follow the caret frame-by-frame — only API 30+ delivers
          // incremental heights; legacy fires once after the keyboard is
          // already up, where keyboardDidShow's smooth reveal takes over
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !isHiding) {
            scrollToFocusedInput(smooth = false)
          }
        }

        override fun keyboardDidShow(height: Int) {
          attachCaretListener()
          scrollToFocusedInput()
        }

        override fun keyboardWillHide() {
          detachCaretListener()
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
    val scrollView = detectedScrollView ?: return

    // A relative footer stays behind the keyboard below the content, so its
    // height shields that much of the keyboard's overlap. An absolute footer
    // floats within the viewport — its clearance is the content padding's job
    // (the caret reveal accounts for it, see scrollToFocusedInput).
    keyboardBottomInset = if (keyboardHeight > 0) {
      val baseInset = maxOf(0, keyboardHeight + minOf(0, delegate?.footerKeyboardOcclusion ?: 0))
      val adjustedInset = maxOf(0, baseInset + keyboardOffset.toInt())
      appliedKeyboardOffset = adjustedInset - baseInset
      adjustedInset
    } else {
      appliedKeyboardOffset = 0
      0
    }
    applyBottomPadding()
    clampScrollPosition()
  }

  // Padding changes don't re-clamp the scroll position until the next layout
  // pass — clamp synchronously so the content follows the shrinking inset on
  // every keyboard frame instead of snapping afterwards
  private fun clampScrollPosition() {
    val scrollView = detectedScrollView ?: return
    val child = scrollView.getChildAt(0) ?: return
    val maxScrollY = maxOf(0, child.height - (scrollView.height - scrollView.paddingTop - scrollView.paddingBottom))
    if (scrollView.scrollY > maxScrollY) {
      scrollView.scrollTo(scrollView.scrollX, maxScrollY)
    }
  }

  private fun scrollToFocusedInput(smooth: Boolean = true) {
    val scrollView = detectedScrollView ?: findScrollView() ?: return
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

    // An absolute footer floats over the viewport's bottom edge — extend the
    // caret target so it clears the footer, not just the keyboard.
    val footerOcclusion = maxOf(0, delegate?.footerKeyboardOcclusion ?: 0)

    val offset = keyboardScrollOffset.toInt()
    val visibleHeight = scrollView.height - scrollView.paddingBottom + appliedKeyboardOffset
    val visibleTop = scrollView.scrollY
    val visibleBottom = scrollView.scrollY + visibleHeight

    val targetY = when {
      caretBottom + offset + footerOcclusion > visibleBottom ->
        caretBottom + offset + footerOcclusion - visibleHeight

      caretTop - offset < visibleTop ->
        (caretTop - offset).coerceAtLeast(0)

      else -> return
    }

    if (smooth) {
      scrollView.smoothScrollTo(0, targetY)
    } else {
      scrollView.scrollTo(0, targetY)
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
