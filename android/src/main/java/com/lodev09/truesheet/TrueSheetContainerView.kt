package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewGroup
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

interface TrueSheetContainerViewDelegate {
  val eventDispatcher: EventDispatcher?
  fun containerViewContentDidChangeSize(width: Int, height: Int)
  fun containerViewContentDidScroll()
  fun containerViewScrollViewDidChange()
  fun containerViewHeaderDidChangeSize(width: Int, height: Int)
  fun containerViewFooterDidChangeSize(width: Int, height: Int)
  fun containerViewPeekDidChangeSize(width: Int, height: Int)
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

  var contentView: TrueSheetContentView? = null
  var headerView: TrueSheetHeaderView? = null
  var footerView: TrueSheetFooterView? = null
  var peekView: TrueSheetPeekView? = null

  var contentHeight: Int = 0
  var headerHeight: Int = 0
  var footerHeight: Int = 0

  /**
   * Distance from the top of the content view to the bottom of the peek view.
   * Includes the peek view's offset within the content (padding, views above it)
   * so the peek detent reveals everything down to the peek content's bottom edge.
   */
  val peekContentHeight: Int
    get() {
      val peek = peekView ?: return 0
      val content = contentView ?: return peek.height

      var bottom = peek.height
      var view: View = peek
      while (view !== content) {
        bottom += view.top
        view = view.parent as? View ?: return peek.height
      }

      return bottom
    }

  var insetAdjustment: TrueSheetInsetAdjustment = TrueSheetInsetAdjustment.AUTOMATIC
  var scrollViewBottomInset: Int = 0
  var scrollableEnabled: Boolean = false
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
    contentView?.setupScrollable(scrollableEnabled, bottomInset)
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
    if (peekView === view || peekView != null) return

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
    contentHeight = height
    delegate?.containerViewContentDidChangeSize(width, height)
  }

  override fun contentViewDidScroll() {
    delegate?.containerViewContentDidScroll()
  }

  override fun contentViewScrollViewDidChange() {
    delegate?.containerViewScrollViewDidChange()
  }

  override fun headerViewDidChangeSize(width: Int, height: Int) {
    headerHeight = height
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
