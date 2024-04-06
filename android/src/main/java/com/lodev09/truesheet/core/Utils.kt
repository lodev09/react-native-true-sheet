package com.lodev09.truesheet.core

import android.view.View
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.PixelUtil

object Utils {
  fun activityView(reactContext: ReactContext): View? {
    val activity = reactContext.currentActivity ?: return null
    return activity.findViewById(android.R.id.content)
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
