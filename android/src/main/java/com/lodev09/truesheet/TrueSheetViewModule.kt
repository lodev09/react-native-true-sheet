package com.lodev09.truesheet

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = TrueSheetViewModule.NAME)
class TrueSheetViewModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = NAME

  companion object {
    const val NAME = "TrueSheetView"
  }
}
