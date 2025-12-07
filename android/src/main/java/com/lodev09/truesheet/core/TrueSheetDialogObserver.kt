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

      // Hide parent if the new sheet would cover it
      parentSheet?.let {
        val parentTop = it.viewController.currentSheetTop
        val newSheetTop = sheetView.viewController.getExpectedSheetTop(detentIndex)
        if (!it.viewController.isExpanded && parentTop <= newSheetTop) {
          it.viewController.hideDialog(emitPosition = true)
        }
      }

      if (!presentedSheetStack.contains(sheetView)) {
        presentedSheetStack.add(sheetView)
      }

      return parentSheet
    }
  }

  /**
   * Called when a sheet has been dismissed.
   * Shows the parent sheet if this sheet was stacked on it.
   */
  @JvmStatic
  fun onSheetDidDismiss(sheetView: TrueSheetView, hadParent: Boolean) {
    synchronized(presentedSheetStack) {
      presentedSheetStack.remove(sheetView)
      if (hadParent) {
        presentedSheetStack.lastOrNull()?.viewController?.showDialog(emitPosition = true)
      }
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
}
