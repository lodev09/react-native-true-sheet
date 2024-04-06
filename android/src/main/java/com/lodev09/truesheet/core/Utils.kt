package com.lodev09.truesheet.core

import android.view.View
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.PixelUtil

object Utils {
  fun screenHeight(reactContext: ReactContext): Int {
    val activity = reactContext.currentActivity ?: return 0
    return activity.findViewById<View>(android.R.id.content).height
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
