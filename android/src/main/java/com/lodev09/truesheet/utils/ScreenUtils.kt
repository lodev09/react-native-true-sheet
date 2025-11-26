package com.lodev09.truesheet.utils

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.util.DisplayMetrics
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import com.facebook.react.bridge.ReactContext

/**
 * Utility object for screen dimension calculations
 */
object ScreenUtils {
  @SuppressLint("DiscouragedApi")
  private fun getIdentifierHeight(context: ReactContext, name: String): Int =
    context.resources.getDimensionPixelSize(
      context.resources.getIdentifier(name, "dimen", "android")
    ).takeIf { it > 0 } ?: 0

  /**
   * Get the status bar height
   *
   * @param context React context
   * @return Status bar height in pixels
   */
  fun getStatusBarHeight(context: ReactContext): Int {
    // Modern approach using WindowInsets (API 30+)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val windowManager = context.getSystemService(WindowManager::class.java)
      val windowMetrics = windowManager?.currentWindowMetrics
      val insets = windowMetrics?.windowInsets?.getInsetsIgnoringVisibility(WindowInsets.Type.statusBars())
      if (insets != null) {
        return insets.top
      }
    }

    // Fallback to legacy approach for older APIs
    return getIdentifierHeight(context, "status_bar_height")
  }

  /**
   * Calculate the screen height
   *
   * @param context React context
   * @param edgeToEdge Whether edge-to-edge mode is enabled
   * @return Screen height in pixels
   */
  @SuppressLint("InternalInsetResource", "DiscouragedApi")
  fun getScreenHeight(context: ReactContext, edgeToEdge: Boolean): Int {
    val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val displayMetrics = DisplayMetrics()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      context.display?.getRealMetrics(displayMetrics)
    } else {
      windowManager.defaultDisplay.getMetrics(displayMetrics)
    }

    val screenHeight = displayMetrics.heightPixels
    val statusBarHeight = getStatusBarHeight(context)

    val hasNavigationBar = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      context.getSystemService(WindowManager::class.java)
        ?.currentWindowMetrics
        ?.windowInsets
        ?.isVisible(WindowInsets.Type.navigationBars()) ?: false
    } else {
      context.resources.getIdentifier("navigation_bar_height", "dimen", "android") > 0
    }

    val navigationBarHeight = if (hasNavigationBar) {
      getIdentifierHeight(context, "navigation_bar_height")
    } else {
      0
    }

    return if (edgeToEdge) {
      // getRealMetrics includes navigation bar height
      // windowManager.defaultDisplay.getMetrics doesn't
      when (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        true -> screenHeight
        false -> screenHeight + navigationBarHeight
      }
    } else {
      screenHeight - statusBarHeight - navigationBarHeight
    }
  }

  /**
   * Get the screen width
   *
   * @param context React context
   * @return Screen width in pixels
   */
  fun getScreenWidth(context: ReactContext): Int {
    val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val windowMetrics = windowManager.currentWindowMetrics
      windowMetrics.bounds.width()
    } else {
      val displayMetrics = DisplayMetrics()
      @Suppress("DEPRECATION")
      windowManager.defaultDisplay.getMetrics(displayMetrics)
      displayMetrics.widthPixels
    }
  }

  /**
   * Get the location of a view in screen coordinates
   *
   * @param view The view to get screen location for
   * @return IntArray with [x, y] coordinates in screen space
   */
  fun getScreenLocation(view: View): IntArray {
    val location = IntArray(2)
    view.getLocationOnScreen(location)
    return location
  }

  /**
   * Get the Y coordinate of a view in screen coordinates
   *
   * @param view The view to get screen Y coordinate for
   * @return Y coordinate in screen space
   */
  fun getScreenY(view: View): Int = getScreenLocation(view)[1]
}
