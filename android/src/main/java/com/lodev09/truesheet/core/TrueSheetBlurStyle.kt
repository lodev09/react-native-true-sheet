package com.lodev09.truesheet.core

import android.graphics.Color
import androidx.annotation.ColorInt

/**
 * Blur styles (`BackgroundBlur` in JS), shared with iOS. Like the iOS trait collection, the styles
 * without a `-light` or `-dark` suffix (other than `default`, which is `light` on iOS) follow the
 * system theme.
 */
enum class TrueSheetBlurStyle {
  LIGHT,
  EXTRA_LIGHT,
  DARK,
  REGULAR,
  PROMINENT,
  SYSTEM_ULTRA_THIN_MATERIAL,
  SYSTEM_THIN_MATERIAL,
  SYSTEM_MATERIAL,
  SYSTEM_THICK_MATERIAL,
  SYSTEM_CHROME_MATERIAL,
  SYSTEM_ULTRA_THIN_MATERIAL_LIGHT,
  SYSTEM_THIN_MATERIAL_LIGHT,
  SYSTEM_MATERIAL_LIGHT,
  SYSTEM_THICK_MATERIAL_LIGHT,
  SYSTEM_CHROME_MATERIAL_LIGHT,
  SYSTEM_ULTRA_THIN_MATERIAL_DARK,
  SYSTEM_THIN_MATERIAL_DARK,
  SYSTEM_MATERIAL_DARK,
  SYSTEM_THICK_MATERIAL_DARK,
  SYSTEM_CHROME_MATERIAL_DARK;

  /** The iOS material's tint at full intensity, measured over black and white. */
  @ColorInt
  fun tint(isDark: Boolean): Int =
    when (this) {
      LIGHT -> Color.argb(78, 252, 252, 252)
      EXTRA_LIGHT -> Color.argb(204, 246, 246, 246)
      DARK -> Color.argb(187, 27, 27, 27)
      REGULAR -> (if (isDark) DARK else LIGHT).tint(isDark)
      PROMINENT -> (if (isDark) DARK else EXTRA_LIGHT).tint(isDark)
      SYSTEM_ULTRA_THIN_MATERIAL -> (if (isDark) SYSTEM_ULTRA_THIN_MATERIAL_DARK else SYSTEM_ULTRA_THIN_MATERIAL_LIGHT).tint(isDark)
      SYSTEM_THIN_MATERIAL -> (if (isDark) SYSTEM_THIN_MATERIAL_DARK else SYSTEM_THIN_MATERIAL_LIGHT).tint(isDark)
      SYSTEM_MATERIAL -> (if (isDark) SYSTEM_MATERIAL_DARK else SYSTEM_MATERIAL_LIGHT).tint(isDark)
      SYSTEM_THICK_MATERIAL -> (if (isDark) SYSTEM_THICK_MATERIAL_DARK else SYSTEM_THICK_MATERIAL_LIGHT).tint(isDark)
      SYSTEM_CHROME_MATERIAL -> (if (isDark) SYSTEM_CHROME_MATERIAL_DARK else SYSTEM_CHROME_MATERIAL_LIGHT).tint(isDark)
      SYSTEM_ULTRA_THIN_MATERIAL_LIGHT -> Color.argb(98, 229, 229, 229)
      SYSTEM_THIN_MATERIAL_LIGHT -> Color.argb(151, 238, 238, 238)
      SYSTEM_MATERIAL_LIGHT -> Color.argb(207, 243, 243, 243)
      SYSTEM_THICK_MATERIAL_LIGHT -> Color.argb(243, 243, 243, 243)
      SYSTEM_CHROME_MATERIAL_LIGHT -> Color.argb(186, 244, 244, 244)
      SYSTEM_ULTRA_THIN_MATERIAL_DARK -> Color.argb(110, 72, 72, 72)
      SYSTEM_THIN_MATERIAL_DARK -> Color.argb(161, 49, 49, 49)
      SYSTEM_MATERIAL_DARK -> Color.argb(203, 39, 39, 39)
      SYSTEM_THICK_MATERIAL_DARK -> Color.argb(249, 32, 32, 32)
      SYSTEM_CHROME_MATERIAL_DARK -> Color.argb(187, 26, 26, 26)
    }

  companion object {
    fun fromString(value: String?): TrueSheetBlurStyle? =
      when (value) {
        "light", "default" -> LIGHT
        "extra-light" -> EXTRA_LIGHT
        "dark" -> DARK
        "regular" -> REGULAR
        "prominent" -> PROMINENT
        "system-ultra-thin-material" -> SYSTEM_ULTRA_THIN_MATERIAL
        "system-thin-material" -> SYSTEM_THIN_MATERIAL
        "system-material" -> SYSTEM_MATERIAL
        "system-thick-material" -> SYSTEM_THICK_MATERIAL
        "system-chrome-material" -> SYSTEM_CHROME_MATERIAL
        "system-ultra-thin-material-light" -> SYSTEM_ULTRA_THIN_MATERIAL_LIGHT
        "system-thin-material-light" -> SYSTEM_THIN_MATERIAL_LIGHT
        "system-material-light" -> SYSTEM_MATERIAL_LIGHT
        "system-thick-material-light" -> SYSTEM_THICK_MATERIAL_LIGHT
        "system-chrome-material-light" -> SYSTEM_CHROME_MATERIAL_LIGHT
        "system-ultra-thin-material-dark" -> SYSTEM_ULTRA_THIN_MATERIAL_DARK
        "system-thin-material-dark" -> SYSTEM_THIN_MATERIAL_DARK
        "system-material-dark" -> SYSTEM_MATERIAL_DARK
        "system-thick-material-dark" -> SYSTEM_THICK_MATERIAL_DARK
        "system-chrome-material-dark" -> SYSTEM_CHROME_MATERIAL_DARK
        else -> null
      }
  }
}
