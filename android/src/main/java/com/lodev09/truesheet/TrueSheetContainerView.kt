package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.view.View
import androidx.core.view.isNotEmpty
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Delegate interface for container view changes
 */
interface TrueSheetContainerViewDelegate {
  fun containerViewContentDidChangeSize(width: Int, height: Int)
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
  TrueSheetFooterViewDelegate {

  var delegate: TrueSheetContainerViewDelegate? = null

  private var stateWrapper: StateWrapper? = null

  // Pending dimensions to update when stateWrapper becomes available
  private var pendingWidth: Int = 0
  private var pendingHeight: Int = 0

  fun setStateWrapper(wrapper: StateWrapper?) {
    stateWrapper = wrapper

    if (wrapper == null) return

    // Get dimensions from parent controller and update state if we haven't yet
    val controller = parent as? TrueSheetViewController
    if (controller != null && pendingWidth == 0) {
      val w = controller.width
      val h = controller.height
      if (w > 0 && h > 0) {
        updateState(w, h)
      }
    }
  }

  /**
   * Update state with container dimensions.
   * Called by the controller when the dialog size changes.
   */
  fun updateState(width: Int, height: Int) {
    // Skip if dimensions haven't changed
    if (width == pendingWidth && height == pendingHeight && stateWrapper != null) {
      return
    }

    // Store dimensions
    pendingWidth = width
    pendingHeight = height

    val sw = stateWrapper ?: return

    val realWidth = width.toFloat().pxToDp()
    val realHeight = height.toFloat().pxToDp()

    val newStateData = WritableNativeMap()
    newStateData.putDouble("containerWidth", realWidth.toDouble())
    newStateData.putDouble("containerHeight", realHeight.toDouble())
    sw.updateState(newStateData)
  }

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
   * Reference to footer view (second child)
   */
  val footerView: TrueSheetFooterView?
    get() = if (childCount > 1 && getChildAt(1) is TrueSheetFooterView) {
      getChildAt(1) as TrueSheetFooterView
    } else {
      null
    }

  /**
   * The content view height
   */
  val contentHeight: Int
    get() = contentView?.height ?: 0

  /**
   * The footer view height
   */
  val footerHeight: Int
    get() = footerView?.height ?: 0

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

    // Clean up delegate when footer view is removed
    if (view is TrueSheetFooterView) {
      view.delegate = null
    }

    super.removeView(view)
  }

  // ==================== TrueSheetContentViewDelegate Implementation ====================

  override fun contentViewDidChangeSize(width: Int, height: Int) {
    // Forward content size changes to controller for sheet resizing
    delegate?.containerViewContentDidChangeSize(width, height)
  }

  // ==================== TrueSheetFooterViewDelegate Implementation ====================

  override fun footerViewDidChangeSize(width: Int, height: Int) {
    // Forward footer size changes to host view for repositioning
    delegate?.containerViewFooterDidChangeSize(width, height)
  }
}
