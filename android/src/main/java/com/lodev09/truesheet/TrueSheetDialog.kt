package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.Rect
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.graphics.drawable.toDrawable
import com.facebook.react.uimanager.ThemedReactContext
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.core.Utils

data class SizeInfo(val index: Int, val value: Float)

@SuppressLint("ClickableViewAccessibility")
class TrueSheetDialog(private val reactContext: ThemedReactContext, private val rootSheetView: ViewGroup) :
  BottomSheetDialog(reactContext) {

  private var windowAnimation: Int = 0

  // First child of the rootSheetView
  private val containerView: ViewGroup?
    get() = if (rootSheetView.childCount > 0) {
      rootSheetView.getChildAt(0) as? ViewGroup
    } else {
      null
    }

  val sheetContainerView: ViewGroup?
    get() = proxyView.parent?.let { it as? ViewGroup }

  /**
   * Specify whether the sheet background is dimmed.
   * Set to `false` to allow interaction with the background components.
   */
  var dimmed = true

  /**
   * The size index that the sheet should start to dim the background.
   * This is ignored if `dimmed` is set to `false`.
   */
  var dimmedIndex = 0

  /**
   * The maximum window height
   */
  var maxScreenHeight = 0

  var contentHeight = 0
  var headerHeight = 0
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

  // 1st child is the header view
  val headerView: ViewGroup?
    get() = containerView?.getChildAt(0) as? ViewGroup

  // 2nd child is the content view
  val contentView: ViewGroup?
    get() = containerView?.getChildAt(1) as? ViewGroup

  // 3rd child is the footer view
  val footerView: ViewGroup?
    get() = containerView?.getChildAt(2) as? ViewGroup

  var sizes: Array<Any> = arrayOf("medium", "large")

  private val proxyView = ConstraintLayout(reactContext)

  init {
    proxyView.addView(rootSheetView)
    setContentView(proxyView)

    // Setup window params to adjust layout based on Keyboard state
    window?.apply {
      // Store current windowAnimation value to toggle later
      windowAnimation = attributes.windowAnimations
    }

    // Update the usable sheet height
    maxScreenHeight = Utils.screenHeight(reactContext, edgeToEdge)
  }

  fun getVisibleContentDimensions() : Rect {
    val rect = Rect()
    proxyView.getGlobalVisibleRect(rect)
    return rect
  }

  override fun getEdgeToEdgeEnabled(): Boolean = edgeToEdge || super.getEdgeToEdgeEnabled()

  override fun onStart() {
    super.onStart()

    // We don't want any of the background to be rendered, it should be completely
    // handled by the React side of things.
    val transparent = Color.TRANSPARENT.toDrawable()
    sheetContainerView?.background = transparent
    proxyView.background = transparent
    rootSheetView.background = transparent

    if (edgeToEdge) {
      super.getEdgeToEdgeEnabled()

      window?.apply {
        setFlags(
          WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
          WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        )
        decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      }
    }
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

        // Add the dimmed background
        setFlags(
          WindowManager.LayoutParams.FLAG_DIM_BEHIND,
          WindowManager.LayoutParams.FLAG_DIM_BEHIND
        )

        setCanceledOnTouchOutside(dismissible)
      } else {
        // Override the background touch and pass it to the components outside
        view.setOnTouchListener { v, event ->
          event.setLocation(event.rawX - v.x, event.rawY - v.y)
          reactContext.currentActivity?.dispatchTouchEvent(event)
          false
        }

        // Remove the dimmed background
        clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)

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
    setupDimmedBackground(sizeIndex)
    if (isShowing) {
      setStateForSizeIndex(sizeIndex)
    } else {
      configure()
      setStateForSizeIndex(sizeIndex)

      if (!animated) {
        // Disable animation
        window?.setWindowAnimations(0)
      }

      show()
    }
  }

  /**
   * Set the state based for the given size index.
   */
  private fun setStateForSizeIndex(index: Int) {
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
            "auto" -> minOf(contentHeight + headerHeight + footerHeight, maxScreenHeight*10/9)

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
  private fun getStateForSizeIndex(index: Int) =
    when (sizes.size) {
      1 -> BottomSheetBehavior.STATE_EXPANDED

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
        }

        2 -> {
          setPeekHeight(getSizeHeight(sizes[0]), isShowing)
          maxHeight = getSizeHeight(sizes[1])
        }

        3 -> {
          // Enables half expanded
          isFitToContents = false

          setPeekHeight(getSizeHeight(sizes[0]), isShowing)

          // Android crashes if 1.0f is specified for the half-expanded ratio
          val ratio = minOf(getSizeHeight(sizes[1]).toFloat() / maxScreenHeight.toFloat(), 0.99f)
          halfExpandedRatio = ratio
          maxHeight = getSizeHeight(sizes[2])
        }
      }
      // Since the React content no longer drives the height calculations, update
      // the proxy view's height to take all the available space.
      proxyView.minHeight = maxHeight
      proxyView.maxHeight = maxHeight
    }
  }

  /**
   * Get the SizeInfo data by state.
   */
  fun getSizeInfoForState(state: Int): SizeInfo? =
    when (sizes.size) {
      1 -> {
        when (state) {
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
