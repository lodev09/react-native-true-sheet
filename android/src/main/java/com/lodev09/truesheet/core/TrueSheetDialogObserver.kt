package com.lodev09.truesheet.core

import com.lodev09.truesheet.TrueSheetView

/**
 * Observes TrueSheet dialog lifecycle to manage sheet stacking.
 * Manages the stack of presented sheets and handles visibility.
 * Focus/blur events are dispatched by TrueSheetViewController tied to dialog lifecycle.
 */
object TrueSheetDialogObserver {

  /**
   * Stack of currently presented sheet views (most recent on top)
   */
  private val presentedSheetStack = mutableListOf<TrueSheetView>()

  /**
   * Called when a sheet is about to be presented.
   * Returns the parent sheet (if any) and handles visibility.
   *
   * @param sheetView The sheet that is about to be presented
   * @param detentIndex The detent index the sheet will be presented at
   * @return The parent sheet view that will lose focus, or null if none
   */
  @JvmStatic
  fun onSheetWillPresent(sheetView: TrueSheetView, detentIndex: Int): TrueSheetView? {
    synchronized(presentedSheetStack) {
      // Get the current topmost sheet (will be the parent)
      val topSheet = presentedSheetStack.lastOrNull()

      // Only treat as parent if the sheet is actually presented and visible
      // This prevents capturing sheets that are behind RN screens
      val parentSheet = topSheet?.takeIf { it.viewController.isPresented }

      // Hide the parent sheet if needed
      parentSheet?.let {
        // Don't hide if the top sheet is fully expanded (covers the screen)
        // or if the top sheet is smaller than the presenting sheet
        // A smaller topSheetTop value means the sheet is taller (closer to top of screen)
        val topSheetTop = it.viewController.currentSheetTop
        val presentingSheetTop = sheetView.viewController.getExpectedSheetTop(detentIndex)

        if (!it.viewController.isExpanded && topSheetTop <= presentingSheetTop) {
          it.viewController.hideDialog()
        }
      }

      // Add new sheet to stack
      if (!presentedSheetStack.contains(sheetView)) {
        presentedSheetStack.add(sheetView)
      }

      return parentSheet
    }
  }

  /**
   * Called when a sheet has been dismissed.
   * Shows the parent sheet if any exists.
   *
   * @param sheetView The sheet that was dismissed
   */
  @JvmStatic
  fun onSheetDidDismiss(sheetView: TrueSheetView) {
    synchronized(presentedSheetStack) {
      presentedSheetStack.remove(sheetView)

      // Show the new topmost sheet (parent)
      presentedSheetStack.lastOrNull()?.let {
        it.viewController.showDialog()
      }
    }
  }

  /**
   * Removes a sheet from the stack without triggering any events.
   * Used when a sheet is being destroyed/cleaned up.
   *
   * @param sheetView The sheet to remove
   */
  @JvmStatic
  fun removeSheet(sheetView: TrueSheetView) {
    synchronized(presentedSheetStack) {
      presentedSheetStack.remove(sheetView)
    }
  }

  /**
   * Clears all tracked sheets.
   * Used when the module is invalidated.
   */
  @JvmStatic
  fun clear() {
    synchronized(presentedSheetStack) {
      presentedSheetStack.clear()
    }
  }
}
