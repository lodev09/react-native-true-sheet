package com.lodev09.truesheet.core

import android.content.Context
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.ReactContext
private const val RN_SCREENS_PACKAGE = "com.swmansion.rnscreens"

/**
 * Observes fragment lifecycle to detect react-native-screens screen presentation.
 * Automatically notifies when screens (modals or pushed) are presented/dismissed.
 */
class RNScreensFragmentObserver(
  private val reactContext: ReactContext,
  private val onScreenPresented: () -> Unit,
  private val onScreenWillDismiss: () -> Unit,
  private val onScreenDidDismiss: () -> Unit
) {
  private var fragmentLifecycleCallback: FragmentManager.FragmentLifecycleCallbacks? = null
  private var activityLifecycleObserver: DefaultLifecycleObserver? = null
  private val activeModalFragments: MutableSet<Fragment> = mutableSetOf()
  private val activePushedFragments: MutableSet<Fragment> = mutableSetOf()
  private var isActivityInForeground = true
  private var pendingDismissRunnable: Runnable? = null
  private var pendingPopRunnable: Runnable? = null
  private var isInitialized = false

  val hasPushedScreens: Boolean
    get() = activePushedFragments.isNotEmpty()

  /**
   * Start observing fragment lifecycle events.
   */
  fun start() {
    val activity = reactContext.currentActivity as? AppCompatActivity ?: return
    val fragmentManager = activity.supportFragmentManager

    // Track activity foreground state to ignore fragment lifecycle events during background/foreground transitions
    activityLifecycleObserver = object : DefaultLifecycleObserver {
      override fun onResume(owner: LifecycleOwner) {
        isActivityInForeground = true
      }

      override fun onPause(owner: LifecycleOwner) {
        isActivityInForeground = false
      }
    }
    activity.lifecycle.addObserver(activityLifecycleObserver!!)

    fragmentLifecycleCallback = object : FragmentManager.FragmentLifecycleCallbacks() {
      override fun onFragmentAttached(fm: FragmentManager, f: Fragment, context: Context) {
        super.onFragmentAttached(fm, f, context)

        // Ignore if app is resuming from background
        if (!isActivityInForeground) return

        // Ignore initial fragment attachments during app startup (cold start deep links)
        if (!isInitialized) return

        if (isModalFragment(f) && !activeModalFragments.contains(f)) {
          // Cancel any pending dismiss since a modal is being presented
          cancelPendingDismiss()

          activeModalFragments.add(f)

          if (activeModalFragments.size == 1) {
            onScreenPresented()
          }
        } else if (activeModalFragments.isEmpty() && pendingDismissRunnable == null && isNonModalScreenFragment(f)) {
          // Check if this is a new push or just re-attaching during pop
          val isPendingPop = pendingPopRunnable != null

          if (isPendingPop) {
            // Screen is being re-attached during pop transition, ignore it
            return
          }

          activePushedFragments.add(f)

          if (activePushedFragments.size == 1) {
            onScreenPresented()
          }
        }
      }

      override fun onFragmentStopped(fm: FragmentManager, f: Fragment) {
        super.onFragmentStopped(fm, f)

        // Ignore if app is going to background (fragments stop with activity)
        if (!isActivityInForeground) return

        // Only trigger when fragment is being removed (not just stopped for navigation)
        if (activeModalFragments.contains(f) && f.isRemoving) {
          activeModalFragments.remove(f)

          if (activeModalFragments.isEmpty()) {
            // Post dismiss to allow fragment attach to cancel if navigation is happening
            schedulePendingDismiss()
          }
        } else if (activePushedFragments.contains(f) && f.isRemoving) {
          activePushedFragments.remove(f)

          if (activePushedFragments.isEmpty()) {
            schedulePendingPop()
          }
        }
      }

      override fun onFragmentDestroyed(fm: FragmentManager, f: Fragment) {
        super.onFragmentDestroyed(fm, f)

        if (activeModalFragments.isEmpty() &&
          activePushedFragments.isEmpty() &&
          pendingDismissRunnable == null &&
          pendingPopRunnable == null
        ) {
          onScreenDidDismiss()
        }
      }
    }

    fragmentManager.registerFragmentLifecycleCallbacks(fragmentLifecycleCallback!!, true)

    // Mark as initialized after a frame to ignore initial fragment attachments during cold start
    activity.window?.decorView?.post {
      isInitialized = true
    }
  }

  /**
   * Stop observing and cleanup.
   */
  fun stop() {
    val activity = reactContext.currentActivity as? AppCompatActivity

    cancelPendingDismiss()
    cancelPendingPop()

    fragmentLifecycleCallback?.let { callback ->
      activity?.supportFragmentManager?.unregisterFragmentLifecycleCallbacks(callback)
    }
    fragmentLifecycleCallback = null

    activityLifecycleObserver?.let { observer ->
      activity?.lifecycle?.removeObserver(observer)
    }
    activityLifecycleObserver = null

    activeModalFragments.clear()
    activePushedFragments.clear()
  }

  private fun schedulePendingDismiss() {
    val activity = reactContext.currentActivity ?: return
    val decorView = activity.window?.decorView ?: return

    cancelPendingDismiss()

    pendingDismissRunnable = Runnable {
      pendingDismissRunnable = null
      if (activeModalFragments.isEmpty()) {
        onScreenWillDismiss()
      }
    }
    decorView.post(pendingDismissRunnable)
  }

  private fun cancelPendingDismiss() {
    val activity = reactContext.currentActivity ?: return
    val decorView = activity.window?.decorView ?: return

    pendingDismissRunnable?.let {
      decorView.removeCallbacks(it)
      pendingDismissRunnable = null
    }
  }

  private fun schedulePendingPop() {
    val activity = reactContext.currentActivity ?: return
    val decorView = activity.window?.decorView ?: return

    cancelPendingPop()

    pendingPopRunnable = Runnable {
      pendingPopRunnable = null
      if (activePushedFragments.isEmpty()) {
        onScreenWillDismiss()
      }
    }
    decorView.post(pendingPopRunnable)
  }

  private fun cancelPendingPop() {
    val activity = reactContext.currentActivity ?: return
    val decorView = activity.window?.decorView ?: return

    pendingPopRunnable?.let {
      decorView.removeCallbacks(it)
      pendingPopRunnable = null
    }
  }

  companion object {
    /**
     * Check if fragment is from react-native-screens.
     */
    private fun isScreensFragment(fragment: Fragment): Boolean = fragment.javaClass.name.startsWith(RN_SCREENS_PACKAGE)

    /**
     * Check if fragment is a non-modal screen (regular push presentation).
     */
    private fun isNonModalScreenFragment(fragment: Fragment): Boolean {
      if (!isScreensFragment(fragment)) return false
      // ScreenModalFragment is always a modal
      if (fragment.javaClass.name.contains("ScreenModalFragment")) return false

      try {
        val getScreenMethod = fragment.javaClass.getMethod("getScreen")
        val screen = getScreenMethod.invoke(fragment) ?: return false

        val getStackPresentationMethod = screen.javaClass.getMethod("getStackPresentation")
        val stackPresentation = getStackPresentationMethod.invoke(screen) ?: return false

        return stackPresentation.toString() == "PUSH"
      } catch (e: Exception) {
        return false
      }
    }

    /**
     * Check if fragment is a react-native-screens modal (fullScreenModal, transparentModal, or formSheet).
     * Uses reflection to check the fragment's screen.stackPresentation property.
     */
    private fun isModalFragment(fragment: Fragment): Boolean {
      val className = fragment.javaClass.name

      if (!isScreensFragment(fragment)) {
        return false
      }

      // ScreenModalFragment is always a modal (used for formSheet with BottomSheetDialog)
      if (className.contains("ScreenModalFragment")) {
        return true
      }

      // For ScreenStackFragment, check the screen's stackPresentation via reflection
      try {
        val getScreenMethod = fragment.javaClass.getMethod("getScreen")
        val screen = getScreenMethod.invoke(fragment) ?: return false

        val getStackPresentationMethod = screen.javaClass.getMethod("getStackPresentation")
        val stackPresentation = getStackPresentationMethod.invoke(screen) ?: return false

        val presentationName = stackPresentation.toString()
        return presentationName == "MODAL" ||
          presentationName == "TRANSPARENT_MODAL" ||
          presentationName == "FORM_SHEET"
      } catch (e: Exception) {
        return false
      }
    }
  }
}
