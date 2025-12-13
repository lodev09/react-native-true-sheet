package com.lodev09.truesheet.core

import android.graphics.Rect
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Tracks keyboard height and notifies on changes.
 * Uses WindowInsetsAnimationCompat on API 30+, ViewTreeObserver fallback on older versions.
 */
class TrueSheetKeyboardHandler(
  private val targetView: View,
  private val reactContext: ThemedReactContext,
  private val onKeyboardHeightChanged: (Int) -> Unit
) {

  private var globalLayoutListener: ViewTreeObserver.OnGlobalLayoutListener? = null
  private var activityRootView: View? = null

  var currentImeHeight: Int = 0
    private set

  fun setup() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      setupAnimationCallback()
    } else {
      setupLegacyListener()
    }
  }

  fun cleanup() {
    globalLayoutListener?.let { listener ->
      activityRootView?.viewTreeObserver?.removeOnGlobalLayoutListener(listener)
      globalLayoutListener = null
      activityRootView = null
    }
    ViewCompat.setWindowInsetsAnimationCallback(targetView, null)
  }

  private fun updateKeyboardHeight(height: Int) {
    if (currentImeHeight != height) {
      currentImeHeight = height
      onKeyboardHeightChanged(height)
    }
  }

  private fun setupAnimationCallback() {
    ViewCompat.setWindowInsetsAnimationCallback(
      targetView,
      object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_CONTINUE_ON_SUBTREE) {
        private var startHeight = 0
        private var endHeight = 0

        private fun getKeyboardHeight(insets: WindowInsetsCompat?): Int {
          return insets?.getInsets(WindowInsetsCompat.Type.ime())?.bottom ?: 0
        }

        override fun onPrepare(animation: WindowInsetsAnimationCompat) {
          startHeight = getKeyboardHeight(ViewCompat.getRootWindowInsets(targetView))
        }

        override fun onStart(
          animation: WindowInsetsAnimationCompat,
          bounds: WindowInsetsAnimationCompat.BoundsCompat
        ): WindowInsetsAnimationCompat.BoundsCompat {
          endHeight = getKeyboardHeight(ViewCompat.getRootWindowInsets(targetView))
          return bounds
        }

        override fun onProgress(
          insets: WindowInsetsCompat,
          runningAnimations: List<WindowInsetsAnimationCompat>
        ): WindowInsetsCompat {
          val imeAnimation = runningAnimations.find {
            it.typeMask and WindowInsetsCompat.Type.ime() != 0
          } ?: return insets

          val fraction = imeAnimation.interpolatedFraction
          val currentHeight = (startHeight + (endHeight - startHeight) * fraction).toInt()
          updateKeyboardHeight(currentHeight)

          return insets
        }

        override fun onEnd(animation: WindowInsetsAnimationCompat) {
          updateKeyboardHeight(getKeyboardHeight(ViewCompat.getRootWindowInsets(targetView)))
        }
      }
    )
  }

  private fun setupLegacyListener() {
    val rootView = reactContext.currentActivity?.window?.decorView?.rootView ?: return
    activityRootView = rootView

    globalLayoutListener = ViewTreeObserver.OnGlobalLayoutListener {
      val rect = Rect()
      rootView.getWindowVisibleDisplayFrame(rect)

      val screenHeight = rootView.height
      val keyboardHeight = screenHeight - rect.bottom

      updateKeyboardHeight(if (keyboardHeight > screenHeight * 0.15) keyboardHeight else 0)
    }

    rootView.viewTreeObserver.addOnGlobalLayoutListener(globalLayoutListener)
  }
}
