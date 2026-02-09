package com.lodev09.truesheet.core

import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.util.RNLog
import com.google.android.material.bottomsheet.BottomSheetBehavior

/**
 * Provides screen dimensions and content measurements for detent calculations.
 */
interface TrueSheetDetentCalculatorDelegate {
  val screenHeight: Int
  val realScreenHeight: Int
  val detents: MutableList<Double>
  val contentHeight: Int
  val headerHeight: Int
  val contentBottomInset: Int
  val maxContentHeight: Int?
  val keyboardInset: Int
}

/**
 * Handles all detent-related calculations for the bottom sheet.
 */
class TrueSheetDetentCalculator(private val reactContext: ThemedReactContext) {

  var delegate: TrueSheetDetentCalculatorDelegate? = null

  private val screenHeight: Int get() = delegate?.screenHeight ?: 0
  private val realScreenHeight: Int get() = delegate?.realScreenHeight ?: 0
  private val detents: List<Double> get() = delegate?.detents ?: emptyList()
  private val contentHeight: Int get() = delegate?.contentHeight ?: 0
  private val headerHeight: Int get() = delegate?.headerHeight ?: 0
  private val contentBottomInset: Int get() = delegate?.contentBottomInset ?: 0
  private val maxContentHeight: Int? get() = delegate?.maxContentHeight
  private val keyboardInset: Int get() = delegate?.keyboardInset ?: 0

  /**
   * Calculate the height in pixels for a given detent value.
   * @param detent The detent value: -1.0 for content-fit, or 0.0-1.0 for screen fraction
   */
  fun getDetentHeight(detent: Double, includeKeyboard: Boolean = true): Int {
    val baseHeight = if (detent == -1.0) {
      contentHeight + headerHeight + contentBottomInset
    } else {
      if (detent <= 0.0 || detent > 1.0) {
        throw IllegalArgumentException("TrueSheet: detent fraction ($detent) must be between 0 and 1")
      }
      (detent * screenHeight).toInt() + contentBottomInset
    }

    val height = if (includeKeyboard) baseHeight + keyboardInset else baseHeight
    val maxAllowedHeight = screenHeight + contentBottomInset
    return maxContentHeight?.let { minOf(height, it, maxAllowedHeight) } ?: minOf(height, maxAllowedHeight)
  }

  /**
   * Get the expected sheet top position for a detent index.
   */
  fun getSheetTopForDetentIndex(index: Int): Int {
    if (index < 0 || index >= detents.size) {
      RNLog.w(reactContext, "TrueSheet: Detent index ($index) is out of bounds (0..${detents.size - 1})")
      return realScreenHeight
    }
    return realScreenHeight - getDetentHeight(detents[index])
  }

  /**
   * Calculate visible sheet height from sheet top position.
   */
  fun getVisibleSheetHeight(sheetTop: Int): Int = realScreenHeight - sheetTop

  /**
   * Convert visible sheet height to position in dp.
   */
  fun getPositionDp(visibleSheetHeight: Int): Float = (screenHeight - visibleSheetHeight).pxToDp()

  /**
   * Returns the raw screen fraction for a detent index (without bottomInset).
   */
  fun getDetentValueForIndex(index: Int): Float {
    if (index < 0 || index >= detents.size) return 0f
    val value = detents[index]
    return if (value == -1.0) {
      (contentHeight + headerHeight).toFloat() / screenHeight.toFloat()
    } else {
      value.toFloat()
    }
  }

  // ====================================================================
  // MARK: - State Mapping
  // ====================================================================

  /**
   * Maps detent index to BottomSheetBehavior state based on detent count.
   */
  fun getStateForDetentIndex(index: Int): Int {
    val stateMap = getDetentStateMap() ?: return BottomSheetBehavior.STATE_HIDDEN
    return stateMap.entries.find { it.value == index }?.key ?: BottomSheetBehavior.STATE_HIDDEN
  }

  /**
   * Maps BottomSheetBehavior state to detent index.
   * @return The detent index, or null if state is not mapped
   */
  fun getDetentIndexForState(state: Int): Int? {
    val stateMap = getDetentStateMap() ?: return null
    return stateMap[state]
  }

  /**
   * Returns state-to-index mapping based on detent count.
   */
  private fun getDetentStateMap(): Map<Int, Int>? =
    when (detents.size) {
      1 -> mapOf(
        BottomSheetBehavior.STATE_COLLAPSED to 0,
        BottomSheetBehavior.STATE_EXPANDED to 0
      )

      2 -> mapOf(
        BottomSheetBehavior.STATE_COLLAPSED to 0,
        BottomSheetBehavior.STATE_HALF_EXPANDED to 1,
        BottomSheetBehavior.STATE_EXPANDED to 1
      )

      3 -> mapOf(
        BottomSheetBehavior.STATE_COLLAPSED to 0,
        BottomSheetBehavior.STATE_HALF_EXPANDED to 1,
        BottomSheetBehavior.STATE_EXPANDED to 2
      )

      else -> null
    }

  // ====================================================================
  // MARK: - Interpolation
  // ====================================================================

  /**
   * Find which segment the position falls into for interpolation.
   * @return Triple(fromIndex, toIndex, progress) where progress is 0-1, or null if no detents
   */
  fun findSegmentForPosition(positionPx: Int): Triple<Int, Int, Float>? {
    val count = detents.size
    if (count == 0) return null

    val firstPos = getSheetTopForDetentIndex(0)

    // Position is below first detent (sheet is being dragged down to dismiss)
    if (positionPx > firstPos) {
      val range = realScreenHeight - firstPos
      val progress = if (range > 0) (positionPx - firstPos).toFloat() / range else 0f
      return Triple(-1, 0, progress)
    }

    if (count == 1) return Triple(0, 0, 0f)

    val lastPos = getSheetTopForDetentIndex(count - 1)
    // Position is above last detent
    if (positionPx < lastPos) {
      return Triple(count - 1, count - 1, 0f)
    }

    // Find the segment containing this position
    for (i in 0 until count - 1) {
      val pos = getSheetTopForDetentIndex(i)
      val nextPos = getSheetTopForDetentIndex(i + 1)

      if (positionPx in nextPos..pos) {
        val range = pos - nextPos
        val progress = if (range > 0) (pos - positionPx).toFloat() / range else 0f
        return Triple(i, i + 1, maxOf(0f, minOf(1f, progress)))
      }
    }

    return Triple(count - 1, count - 1, 0f)
  }

  /**
   * Returns continuous index (e.g., 0.5 = halfway between detent 0 and 1).
   */
  fun getInterpolatedIndexForPosition(positionPx: Int): Float {
    val count = detents.size
    if (count == 0) return -1f

    val segment = findSegmentForPosition(positionPx) ?: return 0f
    val (fromIndex, _, progress) = segment

    if (fromIndex == -1) return -progress
    return fromIndex + progress
  }

  /**
   * Returns interpolated screen fraction for position.
   */
  fun getInterpolatedDetentForPosition(positionPx: Int): Float {
    val count = detents.size
    if (count == 0) return 0f

    val segment = findSegmentForPosition(positionPx) ?: return getDetentValueForIndex(0)
    val (fromIndex, toIndex, progress) = segment

    if (fromIndex == -1) {
      val firstDetent = getDetentValueForIndex(0)
      return maxOf(0f, firstDetent * (1 - progress))
    }

    val fromDetent = getDetentValueForIndex(fromIndex)
    val toDetent = getDetentValueForIndex(toIndex)
    return fromDetent + progress * (toDetent - fromDetent)
  }
}
