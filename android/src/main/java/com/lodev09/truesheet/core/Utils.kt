package com.lodev09.truesheet.core

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Point
import android.view.WindowManager
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.Promise
import com.facebook.react.uimanager.PixelUtil

object Utils {
  @SuppressLint("DiscouragedApi", "InternalInsetResource")
  fun maxSize(context: Context): Point {
    val minPoint = Point()
    val maxPoint = Point()
    val sizePoint = Point()

    val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val display = Assertions.assertNotNull(wm).defaultDisplay
    // getCurrentSizeRange will return the min and max width and height that the window can be
    display.getCurrentSizeRange(minPoint, maxPoint)
    // getSize will return the dimensions of the screen in its current orientation
    display.getSize(sizePoint)
    val attrs = intArrayOf(android.R.attr.windowFullscreen)
    val theme = context.theme
    val ta = theme.obtainStyledAttributes(attrs)
    val windowFullscreen = ta.getBoolean(0, false)

    // We need to add the status bar height to the height if we have a fullscreen window,
    // because Display.getCurrentSizeRange doesn't include it.
    val resources = context.resources
    val statusBarId = resources.getIdentifier("status_bar_height", "dimen", "android")
    var statusBarHeight = 0
    if (windowFullscreen && statusBarId > 0) {
      statusBarHeight = resources.getDimension(statusBarId).toInt()
    }
    return if (sizePoint.x < sizePoint.y) {
      // If we are vertical the width value comes from min width and height comes from max height
      Point(minPoint.x, maxPoint.y + statusBarHeight)
    } else {
      // If we are horizontal the width value comes from max width and height comes from min height
      Point(maxPoint.x, minPoint.y + statusBarHeight)
    }
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
