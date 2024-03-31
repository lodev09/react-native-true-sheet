package com.lodev09.truesheet.utils

import com.facebook.react.uimanager.PixelUtil

fun toDIP(value: Int): Float {
  return PixelUtil.toDIPFromPixel(value.toFloat())
}
