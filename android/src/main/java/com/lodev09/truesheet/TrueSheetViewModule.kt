package com.lodev09.truesheet

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerHelper

@ReactModule(name = TrueSheetViewModule.TAG)
class TrueSheetViewModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = TAG

  private fun withTrueSheetView(tag: Int, closure: (trueSheetView: TrueSheetView) -> Unit) {
    UiThreadUtil.runOnUiThread {
      try {
        val manager = UIManagerHelper.getUIManagerForReactTag(reactApplicationContext, tag)
        val view = manager?.resolveView(tag)
        if (view == null) {
          Log.d(TAG, "TrueSheetView with tag $tag not found")
          return@runOnUiThread
        }

        if (view is TrueSheetView) {
          closure(view)
        } else {
          Log.d(TAG, "View is not of type TrueSheetView")
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  @ReactMethod
  fun present(tag: Int, index: Int, promise: Promise) {
    withTrueSheetView(tag) {
      it.present()
    }
  }

  @ReactMethod
  fun dismiss(tag: Int, promise: Promise) {
    withTrueSheetView(tag) {
      it.dismiss()
    }
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
