package com.lodev09.truesheet.utils

import android.content.Context
import android.content.res.Configuration
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

/**
 * Resolves a processed color (number or `PlatformColor` map) at [key], or null when missing.
 */
fun ReadableMap.getColorOrNull(key: String, context: Context): Int? {
  if (!hasKey(key) || isNull(key)) return null
  val value = if (getType(key) == ReadableType.Map) getMap(key) else getDouble(key)
  return ColorPropConverter.getColor(value, context)
}

val Context.isDarkMode: Boolean
  get() = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
