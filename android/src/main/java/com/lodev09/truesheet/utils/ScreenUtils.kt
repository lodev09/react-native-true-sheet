package com.lodev09.truesheet.utils

import android.os.Build
import android.view.View
import android.view.WindowInsets
import kotlin.math.min

/**
 * Data class for top/bottom insets
 */
data class Insets(val top: Int, val bottom: Int)

/**
 * Utility object for screen dimension calculations.
 * Inset calculation approach inspired by react-native-safe-area-context.
 *
 * Note: This library requires React Native 0.76+ which has minSdk API 24.
 */
object ScreenUtils {
  /**
   * Get root window insets for API 30+ (Android R)
   */
  private fun getInsetsR(rootView: View): Insets? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val insets = rootView.rootWindowInsets?.getInsets(
        WindowInsets.Type.statusBars() or
          WindowInsets.Type.displayCutout() or
          WindowInsets.Type.navigationBars()
      ) ?: return null
      return Insets(
        top = insets.top,
        bottom = insets.bottom
      )
    }
    return null
  }

  /**
   * Get root window insets for API 24-29
   */
  @Suppress("DEPRECATION")
  private fun getInsetsLegacy(rootView: View): Insets? {
    val insets = rootView.rootWindowInsets ?: return null
    return Insets(
      top = insets.systemWindowInsetTop,
      // Use min to avoid including soft keyboard
      bottom = min(insets.systemWindowInsetBottom, insets.stableInsetBottom)
    )
  }

  /**
   * Get safe area insets from a view, using API-appropriate methods.
   *
   * @param view The view to get insets from
   * @return Insets with top (status bar) and bottom (navigation bar) values in pixels
   */
  fun getInsets(view: View): Insets {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      getInsetsR(view)
    } else {
      getInsetsLegacy(view)
    } ?: Insets(0, 0)
  }

  /**
   * Calculate the screen height using the same method as React Native's useWindowDimensions.
   * This returns the window height which automatically accounts for edge-to-edge mode.
   *
   * @param view Any view to get resources from
   * @return Screen height in pixels
   */
  fun getScreenHeight(view: View): Int {
    return view.resources.displayMetrics.heightPixels
  }

  /**
   * Get the screen width using the same method as React Native's useWindowDimensions.
   *
   * @param view Any view to get resources from
   * @return Screen width in pixels
   */
  fun getScreenWidth(view: View): Int {
    return view.resources.displayMetrics.widthPixels
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
