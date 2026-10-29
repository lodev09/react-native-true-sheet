package com.lodev09.truesheet.core

import android.content.Context
import android.graphics.RenderEffect
import android.graphics.Shader
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import androidx.annotation.RequiresApi
import com.lodev09.truesheet.TrueSheetView

/**
 * Manages TrueSheet stacking behavior.
 * Tracks presented sheets and handles visibility when sheets stack on top of each other.
 */
object TrueSheetStackManager {

  private val presentedSheetStack = mutableListOf<TrueSheetView>()

  /**
   * Returns the topmost presented and visible sheet, skipping sheets that are dismissing.
   * A dismissing sheet can't parent a new one: its dim would suppress the child's own dim
   * and then disappear with it, leaving the child undimmed.
   * Must be called within synchronized block.
   */
  private fun findTopmostSheet(): TrueSheetView? =
    presentedSheetStack.lastOrNull {
      it.viewController.run { isPresented && isSheetVisible && !isBeingDismissed }
    }

  /**
   * Returns the topmost sheet hidden by screen navigation that was presented from the same
   * screen as the given sheet. Sheets presented on the covering screen must not parent to it,
   * or the hidden sheet would receive focus and blur events while it can't be seen.
   * Must be called within synchronized block.
   */
  private fun findScreenHiddenSheet(sheetView: TrueSheetView): TrueSheetView? {
    val screenTag = RNScreensEventObserver.findPresenterScreenTag(sheetView)
    if (screenTag == 0) return null

    return presentedSheetStack.lastOrNull {
      it.viewController.run { isPresented && wasHiddenByScreen && !isBeingDismissed } &&
        it.screensEventObserver?.presenterScreenTag == screenTag
    }
  }

  /**
   * Registers a sheet in the stack and returns its parent sheet if any.
   * Only returns a parent if it's in the same container (e.g., same Screen).
   */
  @JvmStatic
  fun registerSheet(sheetView: TrueSheetView): TrueSheetView? {
    synchronized(presentedSheetStack) {
      val parentSheet = (findTopmostSheet() ?: findScreenHiddenSheet(sheetView))
        ?.takeIf { it.rootContainerView == sheetView.rootContainerView }

      if (!presentedSheetStack.contains(sheetView)) {
        presentedSheetStack.add(sheetView)
      }

      return parentSheet
    }
  }

  /**
   * Unregisters a sheet from the stack.
   */
  @JvmStatic
  fun unregisterSheet(sheetView: TrueSheetView) {
    synchronized(presentedSheetStack) {
      presentedSheetStack.remove(sheetView)
    }
  }

  /**
   * Updates parent sheet translation based on the child sheet's position.
   */
  @JvmStatic
  fun updateParentTranslation(sheetView: TrueSheetView) {
    val parentSheet = sheetView.viewController.parentSheetView ?: return

    // Post to ensure layout is complete before reading position
    sheetView.viewController.post {
      val childMinSheetTop = sheetView.viewController.detentCalculator.getSheetTopForDetentIndex(0)
      val childCurrentSheetTop = sheetView.viewController.detentCalculator.getSheetTopForDetentIndex(
        sheetView.viewController.currentDetentIndex
      )
      // Cap to minimum detent position
      val childSheetTop = maxOf(childMinSheetTop, childCurrentSheetTop)
      parentSheet.updateTranslationForChild(childSheetTop)
    }
  }

  /**
   * Returns all sheets presented on top of the given sheet (children/descendants)
   * that are in the same container. Returns them in reverse order (top-most first) for proper dismissal.
   */
  @JvmStatic
  fun getSheetsAbove(sheetView: TrueSheetView): List<TrueSheetView> {
    synchronized(presentedSheetStack) {
      val index = presentedSheetStack.indexOf(sheetView)
      if (index < 0 || index >= presentedSheetStack.size - 1) return emptyList()
      val rootContainer = sheetView.rootContainerView
      return presentedSheetStack.subList(index + 1, presentedSheetStack.size)
        .filter { it.rootContainerView == rootContainer }
        .reversed()
    }
  }

  @JvmStatic
  fun removeSheet(sheetView: TrueSheetView) {
    synchronized(presentedSheetStack) {
      presentedSheetStack.remove(sheetView)
    }
  }

  @JvmStatic
  fun clear() {
    synchronized(presentedSheetStack) {
      presentedSheetStack.clear()
    }
  }

  /**
   * Returns true if the given sheet is the topmost presented sheet in its container.
   */
  @JvmStatic
  fun isTopmostSheet(sheetView: TrueSheetView): Boolean {
    synchronized(presentedSheetStack) {
      val rootContainer = sheetView.rootContainerView
      return presentedSheetStack.lastOrNull { it.rootContainerView == rootContainer } == sheetView
    }
  }

  /**
   * Returns the topmost presented sheet, or null if none.
   */
  @JvmStatic
  fun getTopmostSheet(): TrueSheetView? {
    synchronized(presentedSheetStack) {
      return findTopmostSheet()
    }
  }

  private val savedBackgroundImportance = HashMap<View, Int>()

  /**
   * Hides views behind the topmost dimmed (modal) sheet from accessibility,
   * mirroring BottomSheetDialog behavior. Sheets live in the same window as
   * the app content, so without this TalkBack can traverse behind the sheet.
   *
   * Derived from the current stack state and idempotent — call whenever a
   * sheet presents, dismisses, settles, or changes its dim state.
   */
  @JvmStatic
  fun updateBackgroundAccessibility() {
    synchronized(presentedSheetStack) {
      val topDimmedIndex = presentedSheetStack.indexOfLast {
        it.viewController.run { isPresented && isSheetVisible && !isBeingDismissed && isDimmedAtCurrentDetent }
      }
      val topDimmed = presentedSheetStack.getOrNull(topDimmedIndex)
      val root = topDimmed?.viewController?.coordinatorLayout?.parent as? ViewGroup

      if (root == null) {
        restoreBackgroundAccessibility()
        return
      }

      // The dimmed sheet, any sheets above it, and overlays (rendered above every sheet) stay accessible
      val accessibleCoordinators = presentedSheetStack
        .subList(topDimmedIndex, presentedSheetStack.size)
        .mapNotNull { it.viewController.coordinatorLayout }
        .toSet()

      for (i in 0 until root.childCount) {
        val child = root.getChildAt(i)
        if (child in accessibleCoordinators || child is TrueSheetOverlayRootView) {
          savedBackgroundImportance.remove(child)?.let { child.importantForAccessibility = it }
          continue
        }
        if (!savedBackgroundImportance.containsKey(child)) {
          savedBackgroundImportance[child] = child.importantForAccessibility
        }
        child.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
      }
    }
  }

  private val blurredViews = HashMap<View, Float>()
  private var crossWindowBlurEnabled: Boolean? = null

  /**
   * Whether a dim blur can render: Android 12+, unless the system turns window blurs off for
   * battery saver, a device that can't keep up, or the user's settings. Presented dim blurs
   * follow it as it changes.
   */
  @JvmStatic
  fun isBlurEnabled(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return false
    crossWindowBlurEnabled?.let { return it }

    val windowManager = context.getSystemService(WindowManager::class.java)
    windowManager.addCrossWindowBlurEnabledListener { enabled ->
      crossWindowBlurEnabled = enabled
      synchronized(presentedSheetStack) { presentedSheetStack.toList() }
        .filter { it.viewController.run { isPresented && dimBlur != null } }
        .forEach { it.viewController.updateDimAmount() }
    }
    return windowManager.isCrossWindowBlurEnabled.also { crossWindowBlurEnabled = it }
  }

  /**
   * Blurs every view behind a sheet with a dim blur by the strongest blur among the sheets
   * above it: app content and lower sheets. Overlays render above every sheet and stay sharp.
   *
   * Derived from the current stack state and idempotent — call whenever a sheet's blur radius changes.
   */
  @RequiresApi(Build.VERSION_CODES.S)
  @JvmStatic
  fun updateBackgroundBlur() {
    synchronized(presentedSheetStack) {
      val sheetRadii = presentedSheetStack
        .mapNotNull { sheet -> sheet.viewController.run { coordinatorLayout?.let { it to dimBlurRadius } } }
        .toMap()

      val radii = HashMap<View, Float>()
      sheetRadii.keys.mapNotNull { it.parent as? ViewGroup }.toSet().forEach { root ->
        var radius = 0f
        for (i in root.childCount - 1 downTo 0) {
          val child = root.getChildAt(i)
          if (child is TrueSheetOverlayRootView) continue
          if (radius >= 0.5f) radii[child] = radius
          sheetRadii[child]?.let { radius = maxOf(radius, it) }
        }
      }

      // Includes views of a dismissed sheet's root that are no longer behind any blur
      blurredViews.keys.filter { it !in radii }.forEach {
        it.setRenderEffect(null)
        blurredViews.remove(it)
      }
      radii.forEach { (view, radius) ->
        if (blurredViews[view] == radius) return@forEach
        view.setRenderEffect(RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.CLAMP))
        blurredViews[view] = radius
      }
    }
  }

  private fun restoreBackgroundAccessibility() {
    savedBackgroundImportance.forEach { (view, importance) ->
      view.importantForAccessibility = importance
    }
    savedBackgroundImportance.clear()
  }

  /**
   * Returns the root presented sheet for dismissAll.
   * Starts from the topmost sheet and walks up to find the root of its stack.
   * Stops at modal boundary (parent hidden by modal) or when there's no parent.
   */
  @JvmStatic
  fun getRootSheet(): TrueSheetView? {
    synchronized(presentedSheetStack) {
      val topmost = presentedSheetStack.lastOrNull { it.viewController.isPresented } ?: return null

      var current: TrueSheetView = topmost
      while (true) {
        val parent = current.viewController.parentSheetView ?: return current

        if (parent.viewController.wasHiddenByScreen) {
          return current
        }

        current = parent
      }
    }
  }
}
