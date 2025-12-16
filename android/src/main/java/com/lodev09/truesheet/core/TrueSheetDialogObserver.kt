package com.lodev09.truesheet.core

import com.lodev09.truesheet.TrueSheetView

/**
 * Manages TrueSheet stacking behavior.
 * Tracks presented sheets and handles visibility when sheets stack on top of each other.
 */
object TrueSheetDialogObserver {

  private val presentedSheetStack = mutableListOf<TrueSheetView>()

  /**
   * Called when a sheet is about to be presented.
   * Returns the visible parent sheet to stack on, or null if none.
   */
  @JvmStatic
  fun onSheetWillPresent(sheetView: TrueSheetView, detentIndex: Int): TrueSheetView? {
    synchronized(presentedSheetStack) {
      val parentSheet = presentedSheetStack.lastOrNull()
        ?.takeIf { it.viewController.isPresented && it.viewController.isDialogVisible }

      val childSheetTop = sheetView.viewController.getExpectedSheetTop(detentIndex)
      updateParentTranslations(childSheetTop)

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
        presentedSheetStack.lastOrNull()?.viewController?.translateDialog(0)
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

      // Post to ensure layout is complete before reading position
      sheetView.viewController.post {
        val childMinSheetTop = sheetView.viewController.getExpectedSheetTop(0)
        val childCurrentSheetTop = sheetView.viewController.getExpectedSheetTop(sheetView.viewController.currentDetentIndex)
        // Cap to minimum detent position
        val childSheetTop = maxOf(childMinSheetTop, childCurrentSheetTop)
        updateParentTranslations(childSheetTop, untilIndex = index)
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
   * Translates parent sheets down to match the child sheet's position.
   * @param childSheetTop The top position of the child sheet
   * @param untilIndex If specified, only update sheets up to this index (exclusive)
   */
  private fun updateParentTranslations(childSheetTop: Int, untilIndex: Int = presentedSheetStack.size) {
    for (i in 0 until untilIndex) {
      val parentSheet = presentedSheetStack[i]
      if (!parentSheet.viewController.isDialogVisible) continue
      if (parentSheet.viewController.isExpanded) continue

      val parentSheetTop = parentSheet.viewController.getExpectedSheetTop(parentSheet.viewController.currentDetentIndex)
      if (parentSheetTop < childSheetTop) {
        val translationY = childSheetTop - parentSheetTop
        parentSheet.viewController.translateDialog(translationY)
      } else {
        parentSheet.viewController.translateDialog(0)
      }
    }
  }
}
