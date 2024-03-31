package com.lodev09.truesheet

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerHelper
import com.lodev09.truesheet.utils.withPromise

@ReactModule(name = TrueSheetViewModule.TAG)
class TrueSheetViewModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = TAG

  private fun withTrueSheetView(tag: Int, closure: (trueSheetView: TrueSheetView) -> Unit) {
    UiThreadUtil.runOnUiThread {
      try {
        val manager = UIManagerHelper.getUIManagerForReactTag(reactApplicationContext, tag)
        val view = manager?.resolveView(tag)
        if (view == null) {
          Log.d(TAG, "Tag $tag not found")
          return@runOnUiThread
        }

        if (view is TrueSheetView) {
          closure(view)
        } else {
          Log.d(TAG, "Tag $tag does not match")
        }
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  @ReactMethod
  fun present(tag: Int, index: Int, promise: Promise) {
    withTrueSheetView(tag) {
      it.present(index) {
        withPromise(promise) {
          return@withPromise null
        }
      }
    }
  }

  @ReactMethod
  fun dismiss(tag: Int, promise: Promise) {
    withTrueSheetView(tag) {
      it.dismiss {
        withPromise(promise) {
          return@withPromise null
        }
      }
    }
  }

  companion object {
    const val TAG = "TrueSheetView"
  }
}
