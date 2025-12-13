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
 * Handles keyboard (IME) for sheet translation.
 * Uses WindowInsetsAnimationCompat for smooth animation on API 30+,
 * falls back to ViewTreeObserver on Activity's decor view for API 29 and below.
 *
 * @param targetView The view to translate (typically the bottom sheet)
 * @param reactContext The React context to get the current activity
 * @param topInset The top safe area inset to respect
 */
class TrueSheetKeyboardHandler(
  private val targetView: View,
  private val reactContext: ThemedReactContext,
  private val topInset: () -> Int
) {

  private var globalLayoutListener: ViewTreeObserver.OnGlobalLayoutListener? = null
  private var activityRootView: View? = null

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

  private fun applyTranslation(imeHeight: Int) {
    // Cap translation so sheet doesn't move beyond screen bounds
    val maxTranslation = maxOf(0, targetView.top - topInset())
    val translation = minOf(imeHeight, maxTranslation)
    targetView.translationY = -translation.toFloat()
  }

  /** API 30+ smooth keyboard animation */
  private fun setupAnimationCallback() {
    ViewCompat.setWindowInsetsAnimationCallback(
      targetView,
      object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_CONTINUE_ON_SUBTREE) {
        private var startImeHeight = 0
        private var endImeHeight = 0

        private fun getKeyboardHeight(rootInsets: WindowInsetsCompat?): Int {
          if (rootInsets == null) return 0
          return rootInsets.getInsets(WindowInsetsCompat.Type.ime()).bottom
        }

        override fun onPrepare(animation: WindowInsetsAnimationCompat) {
          startImeHeight = getKeyboardHeight(ViewCompat.getRootWindowInsets(targetView))
        }

        override fun onStart(
          animation: WindowInsetsAnimationCompat,
          bounds: WindowInsetsAnimationCompat.BoundsCompat
        ): WindowInsetsAnimationCompat.BoundsCompat {
          endImeHeight = getKeyboardHeight(ViewCompat.getRootWindowInsets(targetView))
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
          val currentImeHeight = (startImeHeight + (endImeHeight - startImeHeight) * fraction).toInt()
          applyTranslation(currentImeHeight)

          return insets
        }

        override fun onEnd(animation: WindowInsetsAnimationCompat) {
          applyTranslation(getKeyboardHeight(ViewCompat.getRootWindowInsets(targetView)))
        }
      }
    )
  }

  /** API 29 and below fallback using ViewTreeObserver on Activity's root view */
  private fun setupLegacyListener() {
    val rootView = reactContext.currentActivity?.window?.decorView?.rootView ?: return

    activityRootView = rootView

    globalLayoutListener = ViewTreeObserver.OnGlobalLayoutListener {
      val rect = Rect()
      rootView.getWindowVisibleDisplayFrame(rect)

      val screenHeight = rootView.height
      val keyboardHeight = screenHeight - rect.bottom

      if (keyboardHeight > screenHeight * 0.15) {
        applyTranslation(keyboardHeight)
      } else {
        applyTranslation(0)
      }
    }

    rootView.viewTreeObserver.addOnGlobalLayoutListener(globalLayoutListener)
  }
}
