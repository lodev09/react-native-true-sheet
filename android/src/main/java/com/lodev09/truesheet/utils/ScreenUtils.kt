package com.lodev09.truesheet.utils

import android.app.Activity
import android.content.res.Configuration
import android.graphics.Rect
import android.os.Build
import android.view.View
import android.view.WindowInsets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.window.layout.WindowMetricsCalculator
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.systeminfo.ReactNativeVersion
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn
import kotlin.math.min

/**
 * Data class for top/bottom insets
 */
data class Insets(val top: Int, val bottom: Int)

/**
 * Window size as React Native reports it (width, height) and the window height including system bars
 */
data class ScreenMetrics(val width: Int, val height: Int, val realHeight: Int)

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

  // React Native 0.86 (facebook/react-native#53254) reports the window bounds to useWindowDimensions
  private val reportsWindowBounds: Boolean by lazy {
    val version = ReactNativeVersion.VERSION
    (version["major"] as Int) > 0 || (version["minor"] as Int) >= 86
  }

  // Same call as React Native's DeviceInfoModule: the activity's window on every API level,
  // including multi-window
  private fun getWindowBounds(activity: Activity): Rect = WindowMetricsCalculator.getOrCreate().computeCurrentWindowMetrics(activity).bounds

  /**
   * Get the window height, including system bars.
   *
   * @param reactContext The ReactContext to get the activity from
   * @return Window height in pixels
   */
  fun getRealScreenHeight(reactContext: ReactContext): Int {
    val activity = reactContext.currentActivity ?: return reactContext.resources.displayMetrics.heightPixels
    return getWindowBounds(activity).height()
  }

  /**
   * The window size React Native reports to useWindowDimensions (`width`, `height`) and the
   * window height including system bars (`realHeight`). Since 0.86 React Native reports the window
   * bounds, minus the system bars when edge-to-edge is off. Before 0.86 it reports
   * resources.displayMetrics, which excludes the system bars below Android 15.
   *
   * @param reactContext The ReactContext to get the activity and resources from
   * @return Screen metrics in pixels
   */
  fun getScreenMetrics(reactContext: ReactContext): ScreenMetrics {
    val displayMetrics = reactContext.resources.displayMetrics
    val fallback = ScreenMetrics(displayMetrics.widthPixels, displayMetrics.heightPixels, displayMetrics.heightPixels)
    val activity = reactContext.currentActivity ?: return fallback

    val bounds = getWindowBounds(activity)
    if (!reportsWindowBounds) return fallback.copy(realHeight = bounds.height())
    if (isEdgeToEdgeFeatureFlagOn) return ScreenMetrics(bounds.width(), bounds.height(), bounds.height())

    val insets = ViewCompat.getRootWindowInsets(activity.window.decorView)
      ?.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
      ?: return fallback.copy(realHeight = bounds.height())
    return ScreenMetrics(
      width = bounds.width() - insets.left - insets.right,
      height = bounds.height() - insets.top - insets.bottom,
      realHeight = bounds.height()
    )
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
