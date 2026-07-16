package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.util.RNLog
import com.facebook.react.views.view.ReactViewGroup

interface TrueSheetContainerViewDelegate {
  val eventDispatcher: EventDispatcher?
  fun containerViewContentDidChangeSize(width: Int, height: Int)
  fun containerViewContentDidScroll()
  fun containerViewScrollViewDidChange()
  fun containerViewHeaderDidChangeSize(width: Int, height: Int)
  fun containerViewFooterDidChangeSize(width: Int, height: Int)
  fun containerViewPeekDidChangeSize(width: Int, height: Int)
  fun containerViewDidLayout()
}

/**
 * Container view that manages the sheet's content, header, and footer views.
 * Size changes are forwarded to the delegate for sheet reconfiguration.
 */
@SuppressLint("ViewConstructor")
class TrueSheetContainerView(reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  TrueSheetContentViewDelegate,
  TrueSheetHeaderViewDelegate,
  TrueSheetFooterViewDelegate,
  TrueSheetPeekViewDelegate {

  var delegate: TrueSheetContainerViewDelegate? = null
  var stateWrapper: StateWrapper? = null

  var contentView: TrueSheetContentView? = null
  var headerView: TrueSheetHeaderView? = null
  var footerView: TrueSheetFooterView? = null
  var peekView: TrueSheetPeekView? = null

  var footerHeight: Int = 0

  private var scrollableBounded = false

  /**
   * The container's Yoga-resolved natural extent — the height the auto detent
   * needs. In-flow header/footer count; floating (absolute-positioned) ones
   * don't. When a pinned ScrollView bounds the layout, the viewport is
   * replaced by the ScrollView's content size.
   */
  val autoHeight: Int
    get() {
      val scrollDelta = contentView?.let { it.naturalHeight - it.height } ?: 0
      return maxOf(0, height + scrollDelta)
    }

  /**
   * Distance from the top of the container to the bottom of the peek view.
   * Includes the peek view's offset within the layout (in-flow header, padding,
   * views above it) so the peek detent reveals everything down to the peek
   * content's bottom edge. A floating (absolute) header doesn't offset the
   * content, so it doesn't count.
   */
  val peekContentHeight: Int
    get() {
      // No peek view: collapse to the content's layout offset — the bottom of
      // an in-flow header — so the peek detent reveals just the header.
      val peek = peekView ?: return contentView?.top ?: 0

      var bottom = peek.height
      var view: View = peek
      while (view !== this) {
        bottom += view.top
        view = view.parent as? View ?: return peek.height
      }

      return bottom
    }

  var insetAdjustment: TrueSheetInsetAdjustment = TrueSheetInsetAdjustment.AUTOMATIC
  var scrollViewBottomInset: Int = 0
  var scrollableOptions: ScrollableOptions? = null
    set(value) {
      field = value
      contentView?.scrollableOptions = value
    }

  override val eventDispatcher: EventDispatcher?
    get() = delegate?.eventDispatcher

  init {
    // Allow footer to position outside container bounds
    clipChildren = false
    clipToPadding = false
  }

  fun setupScrollable() {
    val bottomInset = if (insetAdjustment == TrueSheetInsetAdjustment.AUTOMATIC) scrollViewBottomInset else 0
    contentView?.setupScrollable(bottomInset)
  }

  /**
   * Tells the shadow node to fill the sheet (flexGrow/flexShrink) instead of
   * sizing naturally, so a pinned ScrollView's viewport is bounded.
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

  // Any layout change here can move the auto detent height (the container's
  // natural height IS the auto height) — let the sheet re-evaluate.
  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    delegate?.containerViewDidLayout()
  }

  fun setupKeyboardHandler() {
    contentView?.setupKeyboardHandler()
  }

  fun cleanupKeyboardHandler() {
    contentView?.cleanupKeyboardHandler()
  }

  override fun addView(child: View?, index: Int) {
    super.addView(child, index)

    when (child) {
      is TrueSheetContentView -> {
        child.delegate = this
        child.scrollableOptions = scrollableOptions
        contentView = child

        // Children mount bottom-up, so the content subtree is complete here.
        // Late-mounted peek views attach themselves instead (see TrueSheetPeekView).
        findPeekView(child)?.let { attachPeekView(it) }
      }

      is TrueSheetHeaderView -> {
        child.delegate = this
        headerView = child
      }

      is TrueSheetFooterView -> {
        child.delegate = this
        footerView = child
      }
    }
  }

  override fun removeViewAt(index: Int) {
    when (val view = getChildAt(index)) {
      is TrueSheetContentView -> {
        view.delegate = null
        contentView = null
        contentViewDidChangeSize(0, 0)
      }

      is TrueSheetHeaderView -> {
        view.delegate = null
        headerView = null
        headerViewDidChangeSize(0, 0)
      }

      is TrueSheetFooterView -> {
        view.delegate = null
        footerView = null
        footerViewDidChangeSize(0, 0)
      }
    }

    super.removeViewAt(index)
  }

  // ==================== Peek View ====================

  private fun findPeekView(view: View): TrueSheetPeekView? {
    if (view is TrueSheetPeekView) return view

    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        findPeekView(view.getChildAt(i))?.let { return it }
      }
    }

    return null
  }

  fun attachPeekView(view: TrueSheetPeekView) {
    if (peekView === view) return

    if (peekView != null) {
      RNLog.w(context as ThemedReactContext, "TrueSheet: Sheet can only have one peek component.")
      return
    }

    peekView = view
    view.delegate = this
    peekViewDidChangeSize(view.width, view.height)
  }

  fun detachPeekView(view: TrueSheetPeekView) {
    if (peekView !== view) return

    view.delegate = null
    peekView = null
    peekViewDidChangeSize(0, 0)
  }

  // ==================== Delegate Implementations ====================

  override fun contentViewDidChangeSize(width: Int, height: Int) {
    delegate?.containerViewContentDidChangeSize(width, height)
  }

  override fun contentViewDidScroll() {
    delegate?.containerViewContentDidScroll()
  }

  override fun contentViewScrollViewDidChange() {
    delegate?.containerViewScrollViewDidChange()
  }

  // The container mirrors the content's bounded state so both fill when a
  // ScrollView is pinned (content bounds the viewport, container fills the sheet).
  override fun contentViewDidChangeScrollableBounded(bounded: Boolean) {
    setScrollableBounded(bounded)
  }

  override fun headerViewDidChangeSize(width: Int, height: Int) {
    delegate?.containerViewHeaderDidChangeSize(width, height)
  }

  override fun footerViewDidChangeSize(width: Int, height: Int) {
    footerHeight = height
    delegate?.containerViewFooterDidChangeSize(width, height)
  }

  override fun peekViewDidChangeSize(width: Int, height: Int) {
    delegate?.containerViewPeekDidChangeSize(width, height)
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
