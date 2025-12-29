package com.lodev09.truesheet.core

import android.graphics.Rect
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.uimanager.ThemedReactContext
import com.lodev09.truesheet.utils.KeyboardUtils

interface TrueSheetKeyboardObserverDelegate {
  fun keyboardWillShow(height: Int)
  fun keyboardWillHide()
  fun keyboardDidHide()
  fun keyboardDidChangeHeight(height: Int)
}

/**
 * Tracks keyboard height and notifies delegate on changes.
 * Uses WindowInsetsAnimationCompat on API 30+, ViewTreeObserver fallback on older versions.
 */
class TrueSheetKeyboardObserver(private val targetView: View, private val reactContext: ThemedReactContext) {

  var delegate: TrueSheetKeyboardObserverDelegate? = null

  var currentHeight: Int = 0
    private set

  var targetHeight: Int = 0
    private set

  var isTransitioning: Boolean = false
    private set

  private var isHiding: Boolean = false
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
    val newHeight = (from + (to - from) * fraction).toInt()
    if (currentHeight != newHeight) {
      currentHeight = newHeight
      delegate?.keyboardDidChangeHeight(newHeight)
    }
  }

  private fun getKeyboardHeight(): Int = KeyboardUtils.getKeyboardHeight(targetView)

  private fun setupAnimationCallback() {
    ViewCompat.setWindowInsetsAnimationCallback(
      targetView,
      object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_CONTINUE_ON_SUBTREE) {
        private var startHeight = 0
        private var endHeight = 0

        override fun onPrepare(animation: WindowInsetsAnimationCompat) {
          startHeight = getKeyboardHeight()
        }

        override fun onStart(
          animation: WindowInsetsAnimationCompat,
          bounds: WindowInsetsAnimationCompat.BoundsCompat
        ): WindowInsetsAnimationCompat.BoundsCompat {
          endHeight = getKeyboardHeight()
          targetHeight = endHeight
          isHiding = endHeight < startHeight
          isTransitioning = true
          if (endHeight > startHeight) {
            delegate?.keyboardWillShow(endHeight)
          } else if (isHiding) {
            delegate?.keyboardWillHide()
          }
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
          val finalHeight = getKeyboardHeight()
          updateHeight(startHeight, finalHeight, 1f)
          isTransitioning = false
          if (isHiding) {
            delegate?.keyboardDidHide()
            isHiding = false
          }
        }
      }
    )
  }

  private fun setupLegacyListener() {
    // Ensure we don't add duplicate listeners
    if (globalLayoutListener != null) return

    val rootView = reactContext.currentActivity?.window?.decorView?.rootView ?: return
    activityRootView = rootView

    globalLayoutListener = ViewTreeObserver.OnGlobalLayoutListener {
      val rect = Rect()
      rootView.getWindowVisibleDisplayFrame(rect)

      val screenHeight = rootView.height
      val keyboardHeight = screenHeight - rect.bottom

      val newHeight = if (keyboardHeight > screenHeight * 0.15) keyboardHeight else 0

      // Skip if already at this height
      if (targetHeight == newHeight) return@OnGlobalLayoutListener

      val previousHeight = currentHeight
      targetHeight = newHeight
      isHiding = newHeight < previousHeight

      isTransitioning = true
      if (newHeight > previousHeight) {
        delegate?.keyboardWillShow(newHeight)
      } else if (isHiding) {
        delegate?.keyboardWillHide()
      }

      // On legacy API, keyboard has already animated - just update immediately
      updateHeight(previousHeight, newHeight, 1f)
      isTransitioning = false

      if (isHiding && newHeight == 0) {
        delegate?.keyboardDidHide()
        isHiding = false
      }
    }

    rootView.viewTreeObserver.addOnGlobalLayoutListener(globalLayoutListener)
  }
}
