package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import android.view.ViewGroup
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

interface TrueSheetContainerViewDelegate {
  fun containerViewContentDidChangeSize(width: Int, height: Int)
  fun containerViewContentDidScroll()
  fun containerViewScrollViewDidChange()
  fun containerViewHeaderDidChangeSize(width: Int, height: Int)
  fun containerViewFooterDidChangeSize(width: Int, height: Int)
  fun containerViewFooterDidLayout()
  fun containerViewPeekDidChangeSize(width: Int, height: Int)

  // See TrueSheetViewController.footerKeyboardShift
  val footerKeyboardShift: Int
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

  var absoluteFooter: Boolean = false
    set(value) {
      if (field == value) return
      field = value
      contentView?.updateContentInset()
    }

  override var footerAvoidsKeyboard: Boolean = true
    set(value) {
      if (field == value) return
      field = value
      contentView?.updateContentInset()
    }

  /**
   * Bottom safe-area inset the footer absorbs as padding — the footer
   * owns the sheet's bottom edge, so its background fills the inset.
   */
  var footerBottomInset: Int = 0
    set(value) {
      field = value
      footerView?.setBottomInset(value)
    }
  var scrollableOptions: ScrollableOptions? = null
    set(value) {
      field = value
      contentView?.scrollableOptions = value
    }

  // React tag of the user-provided scrollable within the content (see the scrollableRef prop)
  var scrollableHandle: Int = -1
    set(value) {
      field = value
      contentView?.scrollableHandle = value
    }

  /**
   * Bottom safe-area inset the plugged scrollable applies as content padding
   * while it can scroll (see ScrollableOptions.contentInsetAdjustment)
   */
  var scrollableBottomInset: Int = 0
    set(value) {
      field = value
      contentView?.bottomInset = value
    }

  init {
    // Allow footer to position outside container bounds
    clipChildren = false
    clipToPadding = false
  }

  /**
   * Attaching a view to a window clears its laid-out state (View.isLaidOut), and React Native lays a view out
   * again only when its frame changes. Content attached with a presented sheet, or a row that
   * removeClippedSubviews brings back, keeps its frame and stays not laid out. Autofill skips a focused view
   * that is not laid out, and a manual autofill request skips the children of such a group, so lay the
   * content out in place before a focus change reaches autofill.
   */
  override fun requestChildFocus(child: View?, focused: View?) {
    layoutInPlaceIfNeeded(this)
    super.requestChildFocus(child, focused)
  }

  // Skips a view React Native has not sized yet: laid out at zero size, a focused view loses focus
  private fun layoutInPlaceIfNeeded(view: View) {
    if (!view.isLaidOut && view.width > 0 && view.height > 0) {
      view.layout(view.left, view.top, view.right, view.bottom)
    }

    if (view is ViewGroup) {
      for (index in 0 until view.childCount) {
        layoutInPlaceIfNeeded(view.getChildAt(index))
      }
    }
  }

  /**
   * Android also defers a focused view's autofill until its next layout while the view is not visible, as
   * when a field gains focus while the sheet slides in. Called once the sheet is presented.
   */
  fun layoutFocusedViewInPlace() {
    val focused = findFocus() ?: return
    if (focused.width > 0 && focused.height > 0) {
      focused.layout(focused.left, focused.top, focused.right, focused.bottom)
    }
  }

  fun setupScrollable() {
    contentView?.setupScrollable()
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
        child.scrollableHandle = scrollableHandle
        child.bottomInset = scrollableBottomInset
        contentView = child

        // State lands before the view is attached, so pull the current value
        contentHeight = child.naturalHeight

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
        child.setBottomInset(footerBottomInset)
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

    // Last-attached wins. During a screen transition the incoming peek mounts
    // before the outgoing one detaches, and the outgoing detach is a no-op.
    peekView?.delegate = null

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

  override val absoluteFooterHeight: Int
    get() = if (absoluteFooter) footerView?.height ?: 0 else 0

  override val absoluteFooterTop: Int
    get() = footerView?.y?.toInt() ?: height

  override val footerKeyboardShift: Int
    get() = delegate?.footerKeyboardShift ?: 0

  override val hasRelativeFooter: Boolean
    get() = footerView != null && !absoluteFooter

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
    // A relative footer takes over the bottom inset — drop the scrollable's;
    // an absolute one may pad the scrollable by its height
    contentView?.updateContentInset()
  }

  override fun footerViewDidLayout() {
    delegate?.containerViewFooterDidLayout()
  }

  override fun peekViewDidChangeSize(width: Int, height: Int) {
    delegate?.containerViewPeekDidChangeSize(width, height)
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
