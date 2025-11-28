package com.lodev09.truesheet.core

import com.lodev09.truesheet.TrueSheetView

/**
 * Observes TrueSheet dialog lifecycle to manage sheet stacking.
 * Automatically hides/shows sheets and dispatches focus/blur events
 * when sheets are presented on top of each other.
 */
object TrueSheetDialogObserver {

  /**
   * Stack of currently presented sheet views (most recent on top)
   */
  private val presentedSheetStack = mutableListOf<TrueSheetView>()

  /**
   * Called when a sheet is about to be presented.
   * Hides and blurs the current topmost sheet if exists.
   *
   * @param sheetView The sheet that is about to be presented
   * @param detentIndex The detent index the sheet will be presented at
   */
  @JvmStatic
  fun onSheetWillPresent(sheetView: TrueSheetView, detentIndex: Int) {
    synchronized(presentedSheetStack) {
      // Get the current topmost sheet
      val topSheet = presentedSheetStack.lastOrNull()

      // Hide and blur the topmost sheet if it exists
      topSheet?.let {
        // Notify that sheet is about to lose focus
        it.viewControllerWillBlur()

        // Don't hide if the top sheet is fully expanded (covers the screen)
        // or if the top sheet is smaller than the presenting sheet
        // A smaller topSheetTop value means the sheet is taller (closer to top of screen)
        val topSheetTop = it.viewController.currentSheetTop
        val presentingSheetTop = sheetView.viewController.getExpectedSheetTop(detentIndex)

        if (!it.viewController.isExpanded && topSheetTop <= presentingSheetTop) {
          it.viewController.hideDialog()
        }

        // Notify that sheet has lost focus
        it.viewControllerDidBlur()
      }

      // Add new sheet to stack
      if (!presentedSheetStack.contains(sheetView)) {
        presentedSheetStack.add(sheetView)
      }
    }
  }

  /**
   * Called when a sheet has been dismissed.
   * Shows and focuses the sheet below it (if any).
   *
   * @param sheetView The sheet that was dismissed
   */
  @JvmStatic
  fun onSheetDidDismiss(sheetView: TrueSheetView) {
    synchronized(presentedSheetStack) {
      presentedSheetStack.remove(sheetView)

      // Show and focus the new topmost sheet
      presentedSheetStack.lastOrNull()?.let {
        // Notify that sheet is about to regain focus
        it.viewControllerWillFocus()

        it.viewController.showDialog()

        // Notify that sheet has regained focus
        it.viewControllerDidFocus()
      }
    }
  }

  /**
   * Removes a sheet from the stack without triggering focus events.
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
