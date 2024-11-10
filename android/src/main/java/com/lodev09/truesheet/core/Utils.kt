package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.util.DisplayMetrics
import android.view.WindowInsets
import android.view.WindowManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.PixelUtil

object Utils {
  // Detect `react-native-edge-to-edge` (https://github.com/zoontek/react-native-edge-to-edge)
  val EDGE_TO_EDGE = try {
    Class.forName("com.zoontek.rnedgetoedge.EdgeToEdgePackage")
    true
  } catch (exception: ClassNotFoundException) {
    false
  }

  @SuppressLint("DiscouragedApi")
  private fun getIdentifierHeight(context: ReactContext, name: String): Int =
    context.resources.getDimensionPixelSize(
      context.resources.getIdentifier(name, "dimen", "android")
    ).takeIf { it > 0 } ?: 0

  @SuppressLint("InternalInsetResource", "DiscouragedApi")
  fun screenHeight(context: ReactContext): Int {
    val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val displayMetrics = DisplayMetrics()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      context.display?.getRealMetrics(displayMetrics)
    } else {
      windowManager.defaultDisplay.getMetrics(displayMetrics)
    }

    val screenHeight = displayMetrics.heightPixels

    val statusBarHeight = getIdentifierHeight(context, "status_bar_height")
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

    if (EDGE_TO_EDGE) {
      // getRealMetrics includes navigation bar height
      // windowManager.defaultDisplay.getMetrics isn't
      return when (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        true -> screenHeight
        false -> screenHeight + navigationBarHeight
      }
    }

    return screenHeight - statusBarHeight - navigationBarHeight
  }

  fun toDIP(value: Int): Float = PixelUtil.toDIPFromPixel(value.toFloat())
  fun toPixel(value: Double): Int = PixelUtil.toPixelFromDIP(value).toInt()

  fun withPromise(promise: Promise, closure: () -> Any?) {
    try {
      val result = closure()
      promise.resolve(result)
    } catch (e: Throwable) {
      e.printStackTrace()
      promise.reject("Error", e.message, e.cause)
    }
  }
}
