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
import com.lodev09.truesheet.utils.isDescendantOf

interface TrueSheetKeyboardObserverDelegate {
  fun keyboardWillShow(height: Int) {}
  fun keyboardDidShow(height: Int) {}
  fun keyboardWillHide() {}
  fun keyboardDidHide() {}
  fun keyboardDidChangeHeight(height: Int) {}
  fun focusDidChange(newFocus: View) {}
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

  fun isFocusedViewWithinSheet(sheetView: View): Boolean {
    val focusedView = targetView.rootView?.findFocus() ?: return false
    var current: View? = focusedView
    while (current != null && current !== targetView) {
      if (current === sheetView) return true
      val parent = current.parent
      current = if (parent is View) parent else null
    }
    return false
  }

  var isHiding: Boolean = false
    private set
  private var globalLayoutListener: ViewTreeObserver.OnGlobalLayoutListener? = null
  private var focusChangeListener: ViewTreeObserver.OnGlobalFocusChangeListener? = null
  private var activityRootView: View? = null
  private var hasTrackedKeyboard = false

  fun start() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      setupAnimationCallback()
    }
    setupGlobalLayoutListener()
    setupFocusChangeListener()
  }

  fun stop() {
    try {
      globalLayoutListener?.let { listener ->
        activityRootView?.viewTreeObserver?.let { observer ->
          if (observer.isAlive) observer.removeOnGlobalLayoutListener(listener)
        }
        globalLayoutListener = null
      }
      focusChangeListener?.let { listener ->
        activityRootView?.viewTreeObserver?.let { observer ->
          if (observer.isAlive) observer.removeOnGlobalFocusChangeListener(listener)
        }
        focusChangeListener = null
      }
    } finally {
      activityRootView = null
      ViewCompat.setWindowInsetsAnimationCallback(targetView, null)
    }
  }

  private fun updateHeight(from: Int, to: Int, fraction: Float) {
    val newHeight = (from + (to - from) * fraction).toInt()
    if (currentHeight != newHeight) {
      currentHeight = newHeight
      if (newHeight > 0) hasTrackedKeyboard = true
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
          } else if (finalHeight > 0) {
            delegate?.keyboardDidShow(finalHeight)
          }
        }
      }
    )
  }

  private fun setupGlobalLayoutListener() {
    // Ensure we don't add duplicate listeners
    if (globalLayoutListener != null) return

    val rootView = targetView.rootView ?: return
    activityRootView = rootView

    globalLayoutListener = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      // An animated change lays out with its final inset before onStart, so check after the frame
      ViewTreeObserver.OnGlobalLayoutListener {
        if (hasUnanimatedChange()) targetView.post(unanimatedChangeCheck)
      }
    } else {
      ViewTreeObserver.OnGlobalLayoutListener {
        val rect = Rect()
        rootView.getWindowVisibleDisplayFrame(rect)

        val screenHeight = rootView.height
        val keyboardHeight = screenHeight - rect.bottom

        applyHeight(if (keyboardHeight > screenHeight * 0.15) keyboardHeight else 0)
      }
    }

    rootView.viewTreeObserver.addOnGlobalLayoutListener(globalLayoutListener)
  }

  // The keyboard can come or go without an insets animation: an input method that shows no keyboard
  // hides it, and a cancelled back gesture ends its hide animation on a 0 inset while the keyboard stays.
  // A keyboard already up before this observer tracked one is left alone.
  private fun hasUnanimatedChange(): Boolean {
    if (isTransitioning) return false
    val keyboardHeight = getKeyboardHeight()
    return if (currentHeight > 0) keyboardHeight == 0 else keyboardHeight > 0 && hasTrackedKeyboard
  }

  // A check posted while the view is attached can still run after stop()
  private val unanimatedChangeCheck = Runnable {
    if (globalLayoutListener != null && hasUnanimatedChange()) applyHeight(getKeyboardHeight())
  }

  private fun applyHeight(newHeight: Int) {
    // Skip if already at this height
    if (targetHeight == newHeight) return

    val previousHeight = currentHeight
    targetHeight = newHeight
    isHiding = newHeight < previousHeight

    isTransitioning = true
    if (newHeight > previousHeight) {
      delegate?.keyboardWillShow(newHeight)
    } else if (isHiding) {
      delegate?.keyboardWillHide()
    }

    // The keyboard has already moved - just update immediately
    updateHeight(previousHeight, newHeight, 1f)
    isTransitioning = false

    if (isHiding && newHeight == 0) {
      delegate?.keyboardDidHide()
      isHiding = false
    } else if (newHeight > 0) {
      delegate?.keyboardDidShow(newHeight)
    }
  }

  private fun setupFocusChangeListener() {
    if (focusChangeListener != null) return

    val rootView = targetView.rootView ?: return
    activityRootView = rootView

    focusChangeListener = ViewTreeObserver.OnGlobalFocusChangeListener { _, newFocus ->
      if (currentHeight > 0 && newFocus != null && newFocus.isDescendantOf(targetView)) {
        delegate?.focusDidChange(newFocus)
      }
    }
    rootView.viewTreeObserver.addOnGlobalFocusChangeListener(focusChangeListener)
  }
}
