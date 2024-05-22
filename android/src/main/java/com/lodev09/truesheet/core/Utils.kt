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
  @SuppressLint("DiscouragedApi", "InternalInsetResource")
  fun screenHeight(context: ReactContext): Int {
    val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val displayMetrics = DisplayMetrics()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      context.display?.getRealMetrics(displayMetrics)
    } else {
      windowManager.defaultDisplay.getMetrics(displayMetrics)
    }

    val screenHeight = displayMetrics.heightPixels

    // Subtract status bar height
    val resourceId = context.resources.getIdentifier("status_bar_height", "dimen", "android")
    val statusBarHeight = if (resourceId > 0) {
      context.resources.getDimensionPixelSize(resourceId)
    } else {
      0
    }

    // Subtract navigation bar height (if present)
    val navigationBarHeight: Int
    val hasNavigationBar = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val windowInsets = context.getSystemService(WindowManager::class.java)
        ?.currentWindowMetrics
        ?.windowInsets
      windowInsets?.isVisible(WindowInsets.Type.navigationBars()) ?: false
    } else {
      val resourceIdNav = context.resources.getIdentifier("navigation_bar_height", "dimen", "android")
      resourceIdNav > 0
    }

    navigationBarHeight = if (hasNavigationBar) {
      val resourceIdNav = context.resources.getIdentifier("navigation_bar_height", "dimen", "android")
      if (resourceIdNav > 0) {
        context.resources.getDimensionPixelSize(resourceIdNav)
      } else {
        0
      }
    } else {
      0
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
