package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup

interface TrueSheetContainerViewDelegate {
  val eventDispatcher: EventDispatcher?
  fun containerViewContentDidChangeSize(width: Int, height: Int)
  fun containerViewHeaderDidChangeSize(width: Int, height: Int)
  fun containerViewFooterDidChangeSize(width: Int, height: Int)
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
  TrueSheetFooterViewDelegate {

  var delegate: TrueSheetContainerViewDelegate? = null

  var contentView: TrueSheetContentView? = null
  var headerView: TrueSheetHeaderView? = null
  var footerView: TrueSheetFooterView? = null

  var contentHeight: Int = 0
  var headerHeight: Int = 0
  var footerHeight: Int = 0

  var insetAdjustment: String = "automatic"
  var scrollViewBottomInset: Int = 0

  override val eventDispatcher: EventDispatcher?
    get() = delegate?.eventDispatcher

  init {
    // Allow footer to position outside container bounds
    clipChildren = false
    clipToPadding = false
  }

  fun setupContentScrollViewPinning() {
    val bottomInset = if (insetAdjustment == "automatic") scrollViewBottomInset else 0
    contentView?.setupScrollViewPinning(bottomInset)
  }

  fun clearContentScrollViewPinning() {
    contentView?.clearScrollViewPinning()
  }

  override fun addView(child: View?, index: Int) {
    super.addView(child, index)

    when (child) {
      is TrueSheetContentView -> {
        child.delegate = this
        contentView = child
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

  // ==================== Delegate Implementations ====================

  override fun contentViewDidChangeSize(width: Int, height: Int) {
    contentHeight = height
    delegate?.containerViewContentDidChangeSize(width, height)
  }

  override fun headerViewDidChangeSize(width: Int, height: Int) {
    headerHeight = height
    delegate?.containerViewHeaderDidChangeSize(width, height)
  }

  override fun footerViewDidChangeSize(width: Int, height: Int) {
    footerHeight = height
    delegate?.containerViewFooterDidChangeSize(width, height)
  }

  companion object {
    const val TAG_NAME = "TrueSheet"
  }
}
