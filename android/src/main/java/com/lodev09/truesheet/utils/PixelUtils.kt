package com.lodev09.truesheet.utils

import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp

/**
 * Utility object for pixel and DIP (density-independent pixel) conversions
 */
object PixelUtils {
  /**
   * Converts pixel value to density-independent pixels (DIP)
   */
  fun toDIP(value: Float): Float = value.pxToDp()

  /**
   * Converts DIP value to pixels
   */
  fun toPixel(value: Double): Float = value.dpToPx()
}
