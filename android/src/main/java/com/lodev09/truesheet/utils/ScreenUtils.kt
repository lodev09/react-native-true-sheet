package com.lodev09.truesheet.utils

import android.content.res.Configuration
import android.graphics.Point
import android.os.Build
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import com.facebook.react.bridge.ReactContext
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
   * Get safe area insets from ReactContext using the activity's decor view.
   *
   * @param reactContext The ReactContext to get insets from
   * @return Insets with top (status bar) and bottom (navigation bar) values in pixels
   */
  fun getInsets(reactContext: ReactContext): Insets {
    val activity = reactContext.currentActivity ?: return Insets(0, 0)
    val decorView = activity.window?.decorView ?: return Insets(0, 0)
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      getInsetsR(decorView)
    } else {
      getInsetsLegacy(decorView)
    } ?: Insets(0, 0)
  }

  /**
   * Get the real physical device screen height, including system bars.
   * This is consistent across all API levels.
   *
   * @param reactContext The ReactContext to get context from
   * @return Real screen height in pixels
   */
  @Suppress("DEPRECATION")
  fun getRealScreenHeight(reactContext: ReactContext): Int {
    val windowManager = reactContext.getSystemService(WindowManager::class.java)
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      windowManager.currentWindowMetrics.bounds.height()
    } else {
      val size = Point()
      windowManager.defaultDisplay.getRealSize(size)
      size.y
    }
  }

  /**
   * Get the screen width using the same method as React Native's useWindowDimensions.
   *
   * @param reactContext The ReactContext to get resources from
   * @return Screen width in pixels
   */
  fun getScreenWidth(reactContext: ReactContext): Int = reactContext.resources.displayMetrics.widthPixels

  /**
   * Calculate the screen height using the same method as React Native's useWindowDimensions.
   * This returns the window height which automatically accounts for edge-to-edge mode.
   *
   * @param reactContext The ReactContext to get resources from
   * @return Screen height in pixels
   */
  fun getScreenHeight(reactContext: ReactContext): Int = reactContext.resources.displayMetrics.heightPixels

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
   * Returns true if the device is a phone in portrait orientation.
   */
  fun isPortraitPhone(reactContext: ReactContext): Boolean {
    val config = reactContext.resources.configuration
    val isPortrait = config.orientation == Configuration.ORIENTATION_PORTRAIT
    val isPhone = config.smallestScreenWidthDp < 600
    return isPortrait && isPhone
  }
}
