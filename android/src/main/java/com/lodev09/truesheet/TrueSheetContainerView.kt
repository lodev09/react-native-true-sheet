package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import androidx.core.view.isNotEmpty
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Delegate interface for container view changes
 */
interface TrueSheetContainerViewDelegate {
  fun containerViewContentDidChangeSize(width: Int, height: Int)
  fun containerViewHeaderDidChangeSize(width: Int, height: Int)
  fun containerViewFooterDidChangeSize(width: Int, height: Int)
}

/**
 * Container view that manages the bottom sheet content and holds content and footer views.
 * Simplified to be a lightweight content manager - events are now handled via dialog delegate.
 */
@SuppressLint("ViewConstructor")
class TrueSheetContainerView(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  TrueSheetContentViewDelegate,
  TrueSheetHeaderViewDelegate,
  TrueSheetFooterViewDelegate {

  var delegate: TrueSheetContainerViewDelegate? = null

  /**
   * Reference to content view (first child)
   */
  val contentView: TrueSheetContentView?
    get() = if (isNotEmpty() && getChildAt(0) is TrueSheetContentView) {
      getChildAt(0) as TrueSheetContentView
    } else {
      null
    }

  /**
   * Reference to header view (second child if present)
   */
  val headerView: TrueSheetHeaderView?
    get() {
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        if (child is TrueSheetHeaderView) return child
      }
      return null
    }

  /**
   * Reference to footer view
   */
  val footerView: TrueSheetFooterView?
    get() {
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        if (child is TrueSheetFooterView) return child
      }
      return null
    }

  /**
   * The content view height
   */
  var contentHeight: Int = 0
  /**
   * The header view height
   */
  var headerHeight: Int = 0

  /**
   * The footer view height
   */
  var footerHeight: Int = 0

  init {
    // Container should not clip children to allow footer to position absolutely
    clipChildren = false
    clipToPadding = false
  }

  override fun addView(child: View?, index: Int) {
    super.addView(child, index)

    // Set up delegate when content view is added
    if (child is TrueSheetContentView) {
      child.delegate = this
    }

    // Set up delegate when header view is added
    if (child is TrueSheetHeaderView) {
      child.delegate = this
    }

    // Set up delegate when footer view is added
    if (child is TrueSheetFooterView) {
      child.delegate = this
    }
  }

  override fun removeView(view: View?) {
    // Clean up delegate when content view is removed
    if (view is TrueSheetContentView) {
      view.delegate = null
    }

    // Clean up delegate when header view is removed
    if (view is TrueSheetHeaderView) {
      view.delegate = null
    }

    // Clean up delegate when footer view is removed
    if (view is TrueSheetFooterView) {
      view.delegate = null
    }

    super.removeView(view)
  }

  // ==================== TrueSheetContentViewDelegate Implementation ====================

  override fun contentViewDidChangeSize(width: Int, height: Int) {
    contentHeight = height
    // Forward content size changes to controller for sheet resizing
    delegate?.containerViewContentDidChangeSize(width, height)
  }

  // ==================== TrueSheetHeaderViewDelegate Implementation ====================

  override fun headerViewDidChangeSize(width: Int, height: Int) {
    headerHeight = height
    // Forward header size changes to host view
    delegate?.containerViewHeaderDidChangeSize(width, height)
  }

  // ==================== TrueSheetFooterViewDelegate Implementation ====================

  override fun footerViewDidChangeSize(width: Int, height: Int) {
    footerHeight = height
    // Forward footer size changes to host view for repositioning
    delegate?.containerViewFooterDidChangeSize(width, height)
  }
}
