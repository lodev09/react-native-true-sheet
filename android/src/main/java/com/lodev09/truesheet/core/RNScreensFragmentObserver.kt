package com.lodev09.truesheet.core

import android.content.Context
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import com.facebook.react.bridge.ReactContext

private const val RN_SCREENS_PACKAGE = "com.swmansion.rnscreens"

/**
 * Observes fragment lifecycle to detect react-native-screens modal presentation.
 * Automatically notifies when modals are presented/dismissed.
 */
class RNScreensFragmentObserver(
  private val reactContext: ReactContext,
  private val onModalPresented: () -> Unit,
  private val onModalDismissed: () -> Unit
) {
  private var fragmentLifecycleCallback: FragmentManager.FragmentLifecycleCallbacks? = null
  private val activeModalFragments: MutableSet<Fragment> = mutableSetOf()

  /**
   * Start observing fragment lifecycle events.
   */
  fun start() {
    val activity = reactContext.currentActivity as? AppCompatActivity ?: return
    val fragmentManager = activity.supportFragmentManager

    fragmentLifecycleCallback = object : FragmentManager.FragmentLifecycleCallbacks() {
      override fun onFragmentPreAttached(fm: FragmentManager, f: Fragment, context: Context) {
        super.onFragmentPreAttached(fm, f, context)

        if (isModalFragment(f) && !activeModalFragments.contains(f)) {
          activeModalFragments.add(f)

          if (activeModalFragments.size == 1) {
            onModalPresented()
          }
        }
      }

      override fun onFragmentStopped(fm: FragmentManager, f: Fragment) {
        super.onFragmentStopped(fm, f)

        // Ignore if app is in background (fragments stop with activity)
        val activity = reactContext.currentActivity as? AppCompatActivity ?: return
        if (!activity.lifecycle.currentState.isAtLeast(androidx.lifecycle.Lifecycle.State.RESUMED)) {
          return
        }

        if (activeModalFragments.contains(f)) {
          activeModalFragments.remove(f)

          if (activeModalFragments.isEmpty()) {
            onModalDismissed()
          }
        }
      }
    }

    fragmentManager.registerFragmentLifecycleCallbacks(fragmentLifecycleCallback!!, true)
  }

  /**
   * Stop observing and cleanup.
   */
  fun stop() {
    fragmentLifecycleCallback?.let { callback ->
      val activity = reactContext.currentActivity as? AppCompatActivity
      activity?.supportFragmentManager?.unregisterFragmentLifecycleCallbacks(callback)
    }
    fragmentLifecycleCallback = null
    activeModalFragments.clear()
  }

  companion object {
    /**
     * Check if fragment is from react-native-screens.
     */
    private fun isScreensFragment(fragment: Fragment): Boolean = fragment.javaClass.name.startsWith(RN_SCREENS_PACKAGE)

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
