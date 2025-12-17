package com.lodev09.truesheet.core

import android.graphics.Rect
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.uimanager.ThemedReactContext

interface TrueSheetKeyboardObserverDelegate {
  fun keyboardWillChangeHeight(from: Int, to: Int)
  fun keyboardDidChangeHeight(from: Int, to: Int, fraction: Float)
}

/**
 * Tracks keyboard height and notifies delegate on changes.
 * Uses WindowInsetsAnimationCompat on API 30+, ViewTreeObserver fallback on older versions.
 */
class TrueSheetKeyboardObserver(private val targetView: View, private val reactContext: ThemedReactContext) {

  var delegate: TrueSheetKeyboardObserverDelegate? = null

  var currentHeight: Int = 0
    private set

  private var globalLayoutListener: ViewTreeObserver.OnGlobalLayoutListener? = null
  private var activityRootView: View? = null

  fun start() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      setupAnimationCallback()
    } else {
      setupLegacyListener()
    }
  }

  fun stop() {
    globalLayoutListener?.let { listener ->
      activityRootView?.viewTreeObserver?.removeOnGlobalLayoutListener(listener)
      globalLayoutListener = null
      activityRootView = null
    }
    ViewCompat.setWindowInsetsAnimationCallback(targetView, null)
  }

  private fun updateHeight(from: Int, to: Int, fraction: Float) {
    val previousHeight = currentHeight
    val newHeight = (from + (to - from) * fraction).toInt()
    if (previousHeight != newHeight) {
      currentHeight = newHeight
      delegate?.keyboardDidChangeHeight(from, to, fraction)
    }
  }

  private fun getKeyboardHeight(insets: WindowInsetsCompat?): Int = insets?.getInsets(WindowInsetsCompat.Type.ime())?.bottom ?: 0

  private fun setupAnimationCallback() {
    ViewCompat.setWindowInsetsAnimationCallback(
      targetView,
      object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_CONTINUE_ON_SUBTREE) {
        private var startHeight = 0
        private var endHeight = 0

        override fun onPrepare(animation: WindowInsetsAnimationCompat) {
          startHeight = getKeyboardHeight(ViewCompat.getRootWindowInsets(targetView))
        }

        override fun onStart(
          animation: WindowInsetsAnimationCompat,
          bounds: WindowInsetsAnimationCompat.BoundsCompat
        ): WindowInsetsAnimationCompat.BoundsCompat {
          endHeight = getKeyboardHeight(ViewCompat.getRootWindowInsets(targetView))
          delegate?.keyboardWillChangeHeight(startHeight, endHeight)
          return bounds
        }

        override fun onProgress(insets: WindowInsetsCompat, runningAnimations: List<WindowInsetsAnimationCompat>): WindowInsetsCompat {
          val imeAnimation = runningAnimations.find {
            it.typeMask and WindowInsetsCompat.Type.ime() != 0
          } ?: return insets

          val fraction = imeAnimation.interpolatedFraction
          updateHeight(startHeight, endHeight, fraction)

          return insets
        }

        override fun onEnd(animation: WindowInsetsAnimationCompat) {
          val finalHeight = getKeyboardHeight(ViewCompat.getRootWindowInsets(targetView))
          updateHeight(startHeight, finalHeight, 1f)
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

      val newHeight = if (keyboardHeight > screenHeight * 0.15) keyboardHeight else 0
      val previousHeight = currentHeight

      if (previousHeight != newHeight) {
        delegate?.keyboardWillChangeHeight(previousHeight, newHeight)
        updateHeight(previousHeight, newHeight, 1f)
      }
    }

    rootView.viewTreeObserver.addOnGlobalLayoutListener(globalLayoutListener)
  }
}
