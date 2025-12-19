package com.lodev09.truesheet.core

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.util.Log
import android.view.View
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout

/**
 * Provides the bottom sheet view and screen measurements for animations.
 */
interface TrueSheetAnimatorProvider {
  val bottomSheetView: FrameLayout?
  val realScreenHeight: Int
}

/**
 * Handles present and dismiss animations for the bottom sheet.
 * Encapsulates animation state and provides a clean callback interface.
 */
class TrueSheetAnimator(private val provider: TrueSheetAnimatorProvider) {

  companion object {
    const val PRESENT_DURATION = 300L
    const val DISMISS_DURATION = 200L
  }

  private var presentAnimator: ValueAnimator? = null
  private var dismissAnimator: ValueAnimator? = null

  var isAnimating: Boolean = false

  /**
   * Animate the sheet presenting from bottom of screen to target position.
   * @param toTop The target top position of the sheet
   * @param onUpdate Called on each animation frame with the effective top position
   * @param onEnd Called when animation completes or is cancelled
   */
  fun animatePresent(toTop: Int, onStart: () -> Unit, onUpdate: (effectiveTop: Int) -> Unit, onEnd: () -> Unit) {
    val bottomSheet = provider.bottomSheetView ?: run {
      onEnd()
      return
    }

    val fromTop = provider.realScreenHeight
    val distance = fromTop - toTop

    presentAnimator?.cancel()
    presentAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
      duration = PRESENT_DURATION
      interpolator = DecelerateInterpolator()

      addUpdateListener { animator ->
        val fraction = animator.animatedValue as Float
        val effectiveTop = fromTop - (distance * fraction).toInt()
        bottomSheet.y = effectiveTop.toFloat()
        onUpdate(effectiveTop)
      }

      addListener(object : AnimatorListenerAdapter() {
        override fun onAnimationStart(animation: Animator) {
          onStart()
          isAnimating = true
        }

        override fun onAnimationEnd(animation: Animator) {
          bottomSheet.y = toTop.toFloat()
          presentAnimator = null
          isAnimating = false
          onEnd()
        }

        override fun onAnimationCancel(animation: Animator) {
          presentAnimator = null
          isAnimating = false
          onEnd()
        }
      })

      start()
    }
  }

  /**
   * Animate the sheet dismissing from current position to bottom of screen.
   * @param onUpdate Called on each animation frame with the effective top position
   * @param onEnd Called when animation completes or is cancelled
   */
  fun animateDismiss(onUpdate: (effectiveTop: Int) -> Unit, onEnd: () -> Unit) {
    val bottomSheet = provider.bottomSheetView ?: run {
      onEnd()
      return
    }

    val fromTop = bottomSheet.y.toInt()
    val toTop = provider.realScreenHeight

    dismissAnimator?.cancel()
    dismissAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
      duration = DISMISS_DURATION
      interpolator = AccelerateInterpolator()

      addUpdateListener { animator ->
        val fraction = animator.animatedValue as Float
        val effectiveTop = fromTop + ((toTop - fromTop) * fraction).toInt()
        bottomSheet.y = effectiveTop.toFloat()
        onUpdate(effectiveTop)
      }

      addListener(object : AnimatorListenerAdapter() {
        override fun onAnimationStart(animation: Animator) {
          isAnimating = true
        }

        override fun onAnimationEnd(animation: Animator) {
          dismissAnimator = null
          isAnimating = false
          onEnd()
        }

        override fun onAnimationCancel(animation: Animator) {
          dismissAnimator = null
          isAnimating = false
          onEnd()
        }
      })

      start()
    }
  }

  /**
   * Cancel any running animations.
   */
  fun cancel() {
    presentAnimator?.cancel()
    presentAnimator = null
    dismissAnimator?.cancel()
    dismissAnimator = null
  }
}
