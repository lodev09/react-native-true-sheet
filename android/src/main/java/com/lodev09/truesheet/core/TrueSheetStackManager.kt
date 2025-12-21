package com.lodev09.truesheet.core

import com.lodev09.truesheet.TrueSheetView

/**
 * Manages TrueSheet stacking behavior.
 * Tracks presented sheets and handles visibility when sheets stack on top of each other.
 */
object TrueSheetStackManager {

  private val presentedSheetStack = mutableListOf<TrueSheetView>()

  /**
   * Called when a sheet is about to be presented.
   * Returns the visible parent sheet to stack on, or null if none.
   */
  @JvmStatic
  fun onSheetWillPresent(sheetView: TrueSheetView, detentIndex: Int): TrueSheetView? {
    synchronized(presentedSheetStack) {
      val parentSheet = presentedSheetStack.lastOrNull()
        ?.takeIf { it.viewController.isPresented && it.viewController.isSheetVisible }

      val childSheetTop = sheetView.viewController.getExpectedSheetTop(detentIndex)
      parentSheet?.updateTranslationForChild(childSheetTop)

      if (!presentedSheetStack.contains(sheetView)) {
        presentedSheetStack.add(sheetView)
      }

      return parentSheet
    }
  }

  /**
   * Called when a sheet has been dismissed.
   * Resets parent sheet translation if this sheet was stacked on it.
   */
  @JvmStatic
  fun onSheetDidDismiss(sheetView: TrueSheetView, hadParent: Boolean) {
    synchronized(presentedSheetStack) {
      presentedSheetStack.remove(sheetView)
      if (hadParent) {
        presentedSheetStack.lastOrNull()?.resetTranslation()
      }
    }
  }

  /**
   * Called when a presented sheet's size changes (e.g., after setupSheetDetents).
   * Updates parent sheet translations to match the new sheet position.
   */
  @JvmStatic
  fun onSheetSizeChanged(sheetView: TrueSheetView) {
    synchronized(presentedSheetStack) {
      val index = presentedSheetStack.indexOf(sheetView)
      if (index <= 0) return

      val parentSheet = presentedSheetStack[index - 1]

      // Post to ensure layout is complete before reading position
      sheetView.viewController.post {
        val childMinSheetTop = sheetView.viewController.getExpectedSheetTop(0)
        val childCurrentSheetTop = sheetView.viewController.getExpectedSheetTop(sheetView.viewController.currentDetentIndex)
        // Cap to minimum detent position
        val childSheetTop = maxOf(childMinSheetTop, childCurrentSheetTop)
        parentSheet.updateTranslationForChild(childSheetTop)
      }
    }
  }

  /**
   * Returns all sheets presented on top of the given sheet (children/descendants).
   * Returns them in reverse order (top-most first) for proper dismissal.
   */
  @JvmStatic
  fun getSheetsAbove(sheetView: TrueSheetView): List<TrueSheetView> {
    synchronized(presentedSheetStack) {
      val index = presentedSheetStack.indexOf(sheetView)
      if (index < 0 || index >= presentedSheetStack.size - 1) return emptyList()
      return presentedSheetStack.subList(index + 1, presentedSheetStack.size).reversed()
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
   * Gets the parent sheet of the given sheet, if any.
   */
  @JvmStatic
  fun getParentSheet(sheetView: TrueSheetView): TrueSheetView? {
    synchronized(presentedSheetStack) {
      val index = presentedSheetStack.indexOf(sheetView)
      if (index <= 0) return null
      return presentedSheetStack[index - 1]
    }
  }

  /**
   * Returns true if the given sheet is the topmost presented sheet.
   */
  @JvmStatic
  fun isTopmostSheet(sheetView: TrueSheetView): Boolean {
    synchronized(presentedSheetStack) {
      return presentedSheetStack.lastOrNull() == sheetView
    }
  }
}
