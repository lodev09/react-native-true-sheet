package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import androidx.core.view.isNotEmpty
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

interface TrueSheetContainerViewDelegate {
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

  val contentView: TrueSheetContentView?
    get() = if (isNotEmpty() && getChildAt(0) is TrueSheetContentView) {
      getChildAt(0) as TrueSheetContentView
    } else {
      null
    }

  val headerView: TrueSheetHeaderView?
    get() {
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        if (child is TrueSheetHeaderView) return child
      }
      return null
    }

  val footerView: TrueSheetFooterView?
    get() {
      for (i in 0 until childCount) {
        val child = getChildAt(i)
        if (child is TrueSheetFooterView) return child
      }
      return null
    }

  var contentHeight: Int = 0
  var headerHeight: Int = 0
  var footerHeight: Int = 0

  init {
    // Allow footer to position outside container bounds
    clipChildren = false
    clipToPadding = false
  }

  override fun addView(child: View?, index: Int) {
    super.addView(child, index)

    when (child) {
      is TrueSheetContentView -> child.delegate = this
      is TrueSheetHeaderView -> child.delegate = this
      is TrueSheetFooterView -> child.delegate = this
    }
  }

  override fun removeViewAt(index: Int) {
    val view = getChildAt(index)

    when (view) {
      is TrueSheetContentView -> view.delegate = null

      is TrueSheetHeaderView -> {
        view.delegate = null
        headerViewDidChangeSize(0, 0)
      }

      is TrueSheetFooterView -> view.delegate = null
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
