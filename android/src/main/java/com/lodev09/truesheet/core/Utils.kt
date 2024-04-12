package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.util.DisplayMetrics
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.PixelUtil

object Utils {
  @SuppressLint("DiscouragedApi", "InternalInsetResource")
  fun screenHeight(reactContext: ReactContext): Int {
    val activity = reactContext.currentActivity ?: return 0

    // Get the screen metrics
    val displayMetrics = DisplayMetrics()
    activity.windowManager.defaultDisplay.getMetrics(displayMetrics)
    val screenHeight = displayMetrics.heightPixels

    val resources = activity.resources

    // Calculate status bar height
    var statusBarHeight = 0
    val resourceId: Int = resources.getIdentifier("status_bar_height", "dimen", "android")
    if (resourceId > 0) {
      statusBarHeight = resources.getDimensionPixelSize(resourceId)
    }

    // Calculate max usable height
    return screenHeight - statusBarHeight
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
