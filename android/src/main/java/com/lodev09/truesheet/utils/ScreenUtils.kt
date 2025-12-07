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
   * Get the WindowInsets for API 30+, or null for older APIs
   */
  private fun getWindowInsets(context: ReactContext): WindowInsets? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      return context.getSystemService(WindowManager::class.java)
        ?.currentWindowMetrics
        ?.windowInsets
    }
    return null
  }

  /**
   * Get the status bar height
   *
   * @param context React context
   * @return Status bar height in pixels
   */
  fun getStatusBarHeight(context: ReactContext): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      getWindowInsets(context)
        ?.getInsetsIgnoringVisibility(WindowInsets.Type.statusBars())
        ?.let { return it.top }
    }
    return getIdentifierHeight(context, "status_bar_height")
  }

  /**
   * Get the navigation bar height (bottom inset)
   *
   * @param context React context
   * @return Navigation bar height in pixels
   */
  fun getNavigationBarHeight(context: ReactContext): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      getWindowInsets(context)
        ?.getInsetsIgnoringVisibility(WindowInsets.Type.navigationBars())
        ?.let { return it.bottom }
    }
    return getIdentifierHeight(context, "navigation_bar_height")
  }

  /**
   * Calculate the screen height using the same method as React Native's useWindowDimensions.
   * This returns the window height which automatically accounts for edge-to-edge mode.
   *
   * @param context React context

   * @return Screen height in pixels
   */
  fun getScreenHeight(context: ReactContext): Int {
    return context.resources.displayMetrics.heightPixels
  }

  /**
   * Get the screen width using the same method as React Native's useWindowDimensions.
   *
   * @param context React context
   * @return Screen width in pixels
   */
  fun getScreenWidth(context: ReactContext): Int {
    return context.resources.displayMetrics.widthPixels
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
