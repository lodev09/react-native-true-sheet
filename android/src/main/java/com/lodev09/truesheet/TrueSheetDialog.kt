package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.core.KeyboardManager
import com.lodev09.truesheet.core.RootSheetView
import com.lodev09.truesheet.core.Utils

data class SizeInfo(val index: Int, val value: Float)

@SuppressLint("ClickableViewAccessibility")
class TrueSheetDialog(private val reactContext: ThemedReactContext, private val rootSheetView: RootSheetView) :
  BottomSheetDialog(reactContext) {

  private var keyboardManager = KeyboardManager(reactContext)
  private var windowAnimation: Int = 0

  // Custom dimming overlay view
  private var dimmingView: View? = null

  // First child of the rootSheetView
  private val containerView: ViewGroup?
    get() = if (rootSheetView.childCount > 0) {
      rootSheetView.getChildAt(0) as? ViewGroup
    } else {
      null
    }

  private val sheetContainerView: ViewGroup?
    get() = rootSheetView.parent?.let { it as? ViewGroup }

  /**
   * Specify whether the sheet background is dimmed.
   * Set to `false` to allow interaction with the background components.
   */
  var dimmed = true
    set(value) {
      field = value
      updateDimmingView()
    }

  /**
   * The size index that the sheet should start to dim the background.
   * This is ignored if `dimmed` is set to `false`.
   */
  var dimmedIndex = 0

  /**
   * The alpha value of the dimmed background.
   *
   * @default 0.75f
   */
  var dimmedAlpha = 0.75f
    set(value) {
      field = value
      updateDimmingView()
    }

  /**
   * The maximum window height
   */
  var maxScreenHeight = 0

  var contentHeight = 0
  var footerHeight = 0
  var maxSheetHeight: Int? = null

  var edgeToEdge: Boolean = false
    set(value) {
      field = value
      maxScreenHeight = Utils.screenHeight(reactContext, value)
    }

  var dismissible: Boolean = true
    set(value) {
      field = value
      setCanceledOnTouchOutside(value)
      setCancelable(value)

      behavior.isHideable = value
    }

  var cornerRadius: Float = 0f
  var backgroundColor: Int = Color.WHITE

  // 1st child is the content view
  val contentView: ViewGroup?
    get() = containerView?.getChildAt(0) as? ViewGroup

  // 2nd child is the footer view
  val footerView: ViewGroup?
    get() = containerView?.getChildAt(1) as? ViewGroup

  var sizes: Array<Any> = arrayOf("medium", "large")

  init {
    setContentView(rootSheetView)

    sheetContainerView?.setBackgroundColor(backgroundColor)
    sheetContainerView?.clipToOutline = true

    // Setup window params to adjust layout based on Keyboard state
    window?.apply {
      // Store current windowAnimation value to toggle later
      windowAnimation = attributes.windowAnimations

      // Disable default dimming
      clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
    }

    // Create and add our custom dimming view
    createDimmingView()

    // Update the usable sheet height
    maxScreenHeight = Utils.screenHeight(reactContext, edgeToEdge)
  }

  /**
   * Create and add a custom dimming view to the dialog
   */
  private fun createDimmingView() {
    // Get the content view of the dialog
    val decorView = window?.decorView as? ViewGroup
    val contentView = decorView?.findViewById<FrameLayout>(android.R.id.content)

    // Create a new view for dimming
    dimmingView = View(context).apply {
      layoutParams = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
      )
      background = ColorDrawable(Color.BLACK)
      alpha = if (dimmed) dimmedAlpha else 0f
      visibility = if (dimmed) View.VISIBLE else View.GONE
      elevation = -1f // Make sure it's below other content

      // Add the view at index 0 so it's behind everything else
      contentView?.addView(this, 0)

      // Make sure it's behind the sheet
      bringToFront()
    }

    // Make sure the sheet is on top of the dimming view
    rootSheetView.bringToFront()
  }

  /**
   * Update the dimming view based on current settings
   */
  private fun updateDimmingView() {
    dimmingView?.apply {
      alpha = if (dimmed) dimmedAlpha else 0f
      visibility = if (dimmed) View.VISIBLE else View.GONE
    }
  }

  override fun getEdgeToEdgeEnabled(): Boolean = edgeToEdge || super.getEdgeToEdgeEnabled()

  override fun onStart() {
    super.onStart()

    if (edgeToEdge) {
      window?.apply {
        setFlags(
          WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
          WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        )

        decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      }
    }

    // Make sure dimming is applied
    updateDimmingView()
  }

  /**
   * Setup background color and corner radius.
   */
  fun setupBackground() {
    val outerRadii = floatArrayOf(
      cornerRadius,
      cornerRadius,
      cornerRadius,
      cornerRadius,
      0f,
      0f,
      0f,
      0f
    )

    val background = ShapeDrawable(RoundRectShape(outerRadii, null, null))

    // Use current background color
    background.paint.color = backgroundColor
    sheetContainerView?.background = background
  }

  /**
   * Setup dimmed sheet.
   * `dimmedIndex` will further customize the dimming behavior.
   */
  fun setupDimmedBackground(sizeIndex: Int) {
    window?.apply {
      val view = findViewById<View>(com.google.android.material.R.id.touch_outside)

      if (dimmed && sizeIndex >= dimmedIndex) {
        // Remove touch listener
        view.setOnTouchListener(null)

        // Show dimming view with the specified alpha
        dimmingView?.visibility = View.VISIBLE
        dimmingView?.alpha = dimmedAlpha

        setCanceledOnTouchOutside(dismissible)
      } else {
        // Override the background touch and pass it to the components outside
        view.setOnTouchListener { v, event ->
          event.setLocation(event.rawX - v.x, event.rawY - v.y)
          reactContext.currentActivity?.dispatchTouchEvent(event)
          false
        }

        // Hide our custom dimming view
        dimmingView?.visibility = View.GONE

        setCanceledOnTouchOutside(false)
      }
    }
  }

  fun resetAnimation() {
    window?.apply {
      setWindowAnimations(windowAnimation)
    }
  }

  /**
   * Present the sheet.
   */
  fun present(sizeIndex: Int, animated: Boolean = true) {
    if (isShowing) {
      setupDimmedBackground(sizeIndex)
      setStateForSizeIndex(sizeIndex)
    } else {
      configure()
      setupDimmedBackground(sizeIndex)
      setStateForSizeIndex(sizeIndex)

      if (!animated) {
        // Disable animation
        window?.setWindowAnimations(0)
      }

      show()

      // Ensure dimming is applied after showing
      if (dimmed && sizeIndex >= dimmedIndex) {
        dimmingView?.visibility = View.VISIBLE
        dimmingView?.alpha = dimmedAlpha
      } else {
        dimmingView?.visibility = View.GONE
      }
    }
  }

  fun positionFooter() {
    footerView?.let { footer ->
      sheetContainerView?.let { container ->
        footer.y = (maxScreenHeight - container.top - footerHeight).toFloat()
      }
    }
  }

  /**
   * Set the state based for the given size index.
   */
  fun setStateForSizeIndex(index: Int) {
    behavior.state = getStateForSizeIndex(index)
  }

  /**
   * Get the height value based on the size config value.
   */
  private fun getSizeHeight(size: Any): Int {
    val height: Int =
      when (size) {
        is Double -> Utils.toPixel(size).toInt()

        is Int -> Utils.toPixel(size.toDouble()).toInt()

        is String -> {
          when (size) {
            "auto" -> contentHeight + footerHeight

            "large" -> maxScreenHeight

            "medium" -> (maxScreenHeight * 0.50).toInt()

            "small" -> (maxScreenHeight * 0.25).toInt()

            else -> {
              if (size.endsWith('%')) {
                val percent = size.trim('%').toDoubleOrNull()
                if (percent == null) {
                  0
                } else {
                  ((percent / 100) * maxScreenHeight).toInt()
                }
              } else {
                val fixedHeight = size.toDoubleOrNull()
                if (fixedHeight == null) {
                  0
                } else {
                  Utils.toPixel(fixedHeight).toInt()
                }
              }
            }
          }
        }

        else -> (maxScreenHeight * 0.5).toInt()
      }

    return maxSheetHeight?.let { minOf(height, it, maxScreenHeight) } ?: minOf(height, maxScreenHeight)
  }

  /**
   * Determines the state based from the given size index.
   */
  private fun getStateForSizeIndex(index: Int): Int {
    return when (sizes.size) {
      1 -> {
        return BottomSheetBehavior.STATE_EXPANDED
      }

      2 -> {
        when (index) {
          0 -> BottomSheetBehavior.STATE_COLLAPSED
          1 -> BottomSheetBehavior.STATE_EXPANDED
          else -> BottomSheetBehavior.STATE_HIDDEN
        }
      }

      3 -> {
        when (index) {
          0 -> BottomSheetBehavior.STATE_COLLAPSED
          1 -> BottomSheetBehavior.STATE_HALF_EXPANDED
          2 -> BottomSheetBehavior.STATE_EXPANDED
          else -> BottomSheetBehavior.STATE_HIDDEN
        }
      }

      else -> BottomSheetBehavior.STATE_HIDDEN
    }
  }

  /**
   * Handle keyboard state changes and adjust maxScreenHeight (sheet max height) accordingly.
   * Also update footer's Y position.
   */
  fun registerKeyboardManager() {
    keyboardManager.registerKeyboardListener(object : KeyboardManager.OnKeyboardChangeListener {
      override fun onKeyboardStateChange(isVisible: Boolean, visibleHeight: Int?) {
        maxScreenHeight = when (isVisible) {
          true -> visibleHeight ?: 0
          else -> Utils.screenHeight(reactContext, edgeToEdge)
        }

        positionFooter()
      }
    })
  }

  fun setOnSizeChangeListener(listener: (w: Int, h: Int) -> Unit) {
    rootSheetView.sizeChangeListener = listener
  }

  /**
   * Remove keyboard listener.
   */
  fun unregisterKeyboardManager() {
    keyboardManager.unregisterKeyboardListener()
  }

  /**
   * Configure the sheet based from the size preference.
   */
  fun configure() {
    // Configure sheet sizes
    behavior.apply {
      skipCollapsed = false
      isFitToContents = true

      // m3 max width 640dp
      maxWidth = Utils.toPixel(640.0).toInt()

      when (sizes.size) {
        1 -> {
          maxHeight = getSizeHeight(sizes[0])
          skipCollapsed = true

          if (sizes[0] == "auto") {
            // Force a layout update
            sheetContainerView?.let {
              val params = it.layoutParams
              params.height = maxHeight
              it.layoutParams = params
            }
          }
        }

        2 -> {
          setPeekHeight(getSizeHeight(sizes[0]), isShowing)
          maxHeight = getSizeHeight(sizes[1])
        }

        3 -> {
          // Enables half expanded
          isFitToContents = false

          setPeekHeight(getSizeHeight(sizes[0]), isShowing)

          halfExpandedRatio = minOf(getSizeHeight(sizes[1]).toFloat() / maxScreenHeight.toFloat(), 1.0f)
          maxHeight = getSizeHeight(sizes[2])
        }
      }
    }
  }

  /**
   * Get the SizeInfo data by state.
   */
  fun getSizeInfoForState(state: Int): SizeInfo? =
    when (sizes.size) {
      1 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> SizeInfo(0, Utils.toDIP(behavior.maxHeight.toFloat()))
          BottomSheetBehavior.STATE_EXPANDED -> SizeInfo(0, Utils.toDIP(behavior.maxHeight.toFloat()))
          else -> null
        }
      }

      2 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> SizeInfo(0, Utils.toDIP(behavior.peekHeight.toFloat()))
          BottomSheetBehavior.STATE_EXPANDED -> SizeInfo(1, Utils.toDIP(behavior.maxHeight.toFloat()))
          else -> null
        }
      }

      3 -> {
        when (state) {
          BottomSheetBehavior.STATE_COLLAPSED -> SizeInfo(0, Utils.toDIP(behavior.peekHeight.toFloat()))

          BottomSheetBehavior.STATE_HALF_EXPANDED -> {
            val height = behavior.halfExpandedRatio * maxScreenHeight
            SizeInfo(1, Utils.toDIP(height))
          }

          BottomSheetBehavior.STATE_EXPANDED -> SizeInfo(2, Utils.toDIP(behavior.maxHeight.toFloat()))

          else -> null
        }
      }

      else -> null
    }

  /**
   * Get SizeInfo data for given size index.
   */
  fun getSizeInfoForIndex(index: Int) = getSizeInfoForState(getStateForSizeIndex(index)) ?: SizeInfo(0, 0f)

  companion object {
    const val TAG = "TrueSheetView"
  }
}
