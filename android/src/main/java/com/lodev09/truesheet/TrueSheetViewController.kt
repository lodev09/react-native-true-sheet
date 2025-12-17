package com.lodev09.truesheet

import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.util.Log
import android.util.TypedValue
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.FrameLayout
import androidx.core.view.isNotEmpty
import androidx.core.view.isVisible
import com.facebook.react.R
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.util.RNLog
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.lodev09.truesheet.core.GrabberOptions
import com.lodev09.truesheet.core.RNScreensFragmentObserver
import com.lodev09.truesheet.core.TrueSheetDimView
import com.lodev09.truesheet.core.TrueSheetGrabberView
import com.lodev09.truesheet.core.TrueSheetKeyboardObserver
import com.lodev09.truesheet.core.TrueSheetKeyboardObserverDelegate
import com.lodev09.truesheet.utils.ScreenUtils

data class DetentInfo(val index: Int, val position: Float)

interface TrueSheetViewControllerDelegate {
  fun viewControllerWillPresent(index: Int, position: Float, detent: Float)
  fun viewControllerDidPresent(index: Int, position: Float, detent: Float)
  fun viewControllerWillDismiss()
  fun viewControllerDidDismiss(hadParent: Boolean)
  fun viewControllerDidChangeDetent(index: Int, position: Float, detent: Float)
  fun viewControllerDidDragBegin(index: Int, position: Float, detent: Float)
  fun viewControllerDidDragChange(index: Int, position: Float, detent: Float)
  fun viewControllerDidDragEnd(index: Int, position: Float, detent: Float)
  fun viewControllerDidChangePosition(index: Float, position: Float, detent: Float, realtime: Boolean)
  fun viewControllerDidChangeSize(width: Int, height: Int)
  fun viewControllerWillFocus()
  fun viewControllerDidFocus()
  fun viewControllerWillBlur()
  fun viewControllerDidBlur()
  fun viewControllerDidBackPress()
}

/**
 * TrueSheetViewController manages the bottom sheet dialog and its presentation lifecycle.
 * This view also acts as a RootView to properly handle and dispatch touch events to React Native.
 */
@SuppressLint("ClickableViewAccessibility", "ViewConstructor")
class TrueSheetViewController(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  RootView {

  companion object {
    const val TAG_NAME = "TrueSheet"

    private const val MAX_HALF_EXPANDED_RATIO = 0.999f

    private const val GRABBER_TAG = "TrueSheetGrabber"
    private const val DEFAULT_MAX_WIDTH = 640 // dp
    private const val DEFAULT_CORNER_RADIUS = 16 // dp

    // Animation durations
    private const val PRESENT_ANIMATION_DURATION = 300L
    private const val DISMISS_ANIMATION_DURATION = 200L
    private const val TRANSLATE_ANIMATION_DURATION = 200L
  }

  // ====================================================================
  // MARK: - Delegate
  // ====================================================================

  var delegate: TrueSheetViewControllerDelegate? = null

  // ====================================================================
  // MARK: - Dialog & Views
  // ====================================================================

  private var dialog: BottomSheetDialog? = null
  private var dimView: TrueSheetDimView? = null
  private var parentDimView: TrueSheetDimView? = null

  private val behavior: BottomSheetBehavior<FrameLayout>?
    get() = dialog?.behavior

  private val sheetContainer: FrameLayout?
    get() = this.parent as? FrameLayout

  private val bottomSheetView: FrameLayout?
    get() = dialog?.findViewById(com.google.android.material.R.id.design_bottom_sheet)

  private val containerView: TrueSheetContainerView?
    get() = if (this.isNotEmpty()) getChildAt(0) as? TrueSheetContainerView else null

  private val contentHeight: Int
    get() = containerView?.contentHeight ?: 0

  private val headerHeight: Int
    get() = containerView?.headerHeight ?: 0

  // ====================================================================
  // MARK: - State
  // ====================================================================

  var isPresented = false
    private set

  var isDialogVisible = false
    private set

  var currentDetentIndex: Int = -1
    private set

  private var lastStateWidth: Int = 0
  private var lastStateHeight: Int = 0
  private var isDragging = false
  private var isDismissing = false
  private var isReconfiguring = false
  private var lastEmittedPositionPx: Int = -1
  private var dragStartDetentIndex: Int = -1
  private var preKeyboardDetentIndex: Int = -1
  private var isKeyboardTransition = false

  /** Tracks if this sheet was hidden due to a RN Screens modal (vs sheet stacking) */
  private var wasHiddenByModal = false

  var presentPromise: (() -> Unit)? = null
  var dismissPromise: (() -> Unit)? = null

  // Reference to parent TrueSheetView (if presented from another sheet)
  var parentSheetView: TrueSheetView? = null

  // Tracks whether the current presentation should be animated
  private var shouldAnimatePresent = true

  private var presentAnimator: ValueAnimator? = null
  private var dismissAnimator: ValueAnimator? = null

  // ====================================================================
  // MARK: - Configuration Properties
  // ====================================================================

  val screenHeight: Int
    get() = ScreenUtils.getScreenHeight(reactContext)
  val screenWidth: Int
    get() = ScreenUtils.getScreenWidth(reactContext)
  val realScreenHeight: Int
    get() = ScreenUtils.getRealScreenHeight(reactContext)

  var maxSheetHeight: Int? = null
  var detents = mutableListOf(0.5, 1.0)

  var dimmed = true
  var dimmedDetentIndex = 0
  var grabber: Boolean = true
  var grabberOptions: GrabberOptions? = null
  var sheetCornerRadius: Float = DEFAULT_CORNER_RADIUS.dpToPx()
    set(value) {
      field = if (value < 0) DEFAULT_CORNER_RADIUS.dpToPx() else value
      if (isPresented) setupBackground()
    }
  var sheetBackgroundColor: Int? = null
  var edgeToEdgeFullScreen: Boolean = false

  var dismissible: Boolean = true
    set(value) {
      field = value
      dialog?.apply {
        setCanceledOnTouchOutside(value)
        setCancelable(value)
        behavior.isHideable = value
      }
    }

  var draggable: Boolean = true
    set(value) {
      field = value
      behavior?.isDraggable = value
    }

  // ====================================================================
  // MARK: - Computed Properties
  // ====================================================================

  val bottomInset: Int
    get() = if (edgeToEdgeEnabled) ScreenUtils.getInsets(reactContext).bottom else 0

  val topInset: Int
    get() = if (edgeToEdgeEnabled) ScreenUtils.getInsets(reactContext).top else 0

  var insetAdjustment: String = "automatic"

  /** Auto add bottom inset for consistency with iOS when insetAdjustment is 'automatic' */
  val contentBottomInset: Int
    get() = if (insetAdjustment == "automatic") bottomInset else 0

  /** Edge-to-edge enabled by default on API 36+, or when explicitly configured. */
  private val edgeToEdgeEnabled: Boolean
    get() {
      val defaultEnabled = android.os.Build.VERSION.SDK_INT >= 36
      return BuildConfig.EDGE_TO_EDGE_ENABLED || dialog?.edgeToEdgeEnabled == true || defaultEnabled
    }

  internal var eventDispatcher: EventDispatcher? = null
  private val jSTouchDispatcher = JSTouchDispatcher(this)
  private var jSPointerDispatcher: JSPointerDispatcher? = null

  /** Hides/shows the sheet when RN Screens modals are presented/dismissed. */
  private var rnScreensObserver: RNScreensFragmentObserver? = null

  // ====================================================================
  // MARK: - Initialization
  // ====================================================================

  init {
    jSPointerDispatcher = JSPointerDispatcher(this)
  }

  // ====================================================================
  // MARK: - Dialog Lifecycle
  // ====================================================================

  fun createDialog() {
    if (dialog != null) return

    val style = if (edgeToEdgeEnabled) {
      com.lodev09.truesheet.R.style.TrueSheetEdgeToEdgeEnabledDialog
    } else {
      com.lodev09.truesheet.R.style.TrueSheetDialog
    }

    dialog = BottomSheetDialog(reactContext, style).apply {
      setContentView(this@TrueSheetViewController)

      window?.apply {
        // Disable default animation as we are using custom animation
        setWindowAnimations(0)

        // Keyboard avoidance handled by TrueSheetKeyboardObserver
        setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING)
      }

      setupModalObserver()
      setupDialogListeners(this)
      setupBottomSheetBehavior(this)

      setCanceledOnTouchOutside(dismissible)
      setCancelable(dismissible)
      behavior.isHideable = dismissible
      behavior.isDraggable = draggable

      onBackPressedDispatcher.addCallback(object : androidx.activity.OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          this@TrueSheetViewController.delegate?.viewControllerDidBackPress()
          if (dismissible) {
            dismiss()
          }
        }
      })
    }
  }

  private fun cleanupDialog() {
    dialog?.apply {
      setOnShowListener(null)
      setOnCancelListener(null)
      setOnDismissListener(null)
    }

    cleanupKeyboardObserver()
    cleanupModalObserver()
    presentAnimator?.cancel()
    presentAnimator = null
    dismissAnimator?.cancel()
    dismissAnimator = null
    dimView?.detach()
    dimView = null
    parentDimView?.detach()
    parentDimView = null
    sheetContainer?.removeView(this)

    dialog = null
    isDragging = false
    isDismissing = false
    isPresented = false
    isDialogVisible = false
    wasHiddenByModal = false
    lastEmittedPositionPx = -1
    shouldAnimatePresent = true
  }

  private fun setupDialogListeners(dialog: BottomSheetDialog) {
    dialog.setOnShowListener {
      bottomSheetView?.visibility = VISIBLE
      isPresented = true
      isDialogVisible = true

      setupKeyboardObserver()

      if (shouldAnimatePresent) {
        animatePresent {
          finishPresent()
        }
      } else {
        val toTop = getExpectedSheetTop(currentDetentIndex)
        emitChangePositionDelegate(toTop)
        positionFooter()
        finishPresent()
      }
    }

    dialog.setOnDismissListener {
      emitDidDismissEvents()
      cleanupDialog()
    }
  }

  private fun setupBottomSheetBehavior(dialog: BottomSheetDialog) {
    dialog.behavior.addBottomSheetCallback(
      object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(sheetView: View, slideOffset: Float) {
          val behavior = behavior ?: return

          // Recalculate translation based on current keyboard height and sheet position
          val keyboardHeight = keyboardObserver?.currentHeight ?: 0
          applyClampedTranslation(sheetView, -keyboardHeight.toFloat())

          val effectiveTop = sheetView.top + sheetView.translationY.toInt()
          emitChangePositionDelegate(effectiveTop)

          when (behavior.state) {
            BottomSheetBehavior.STATE_DRAGGING,
            BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

            else -> { }
          }

          positionFooter(slideOffset)
          updateDimAmount(effectiveTop)
        }

        override fun onStateChanged(sheetView: View, newState: Int) {
          if (newState == BottomSheetBehavior.STATE_HIDDEN) {
            // Behavior already animated to hidden, just dismiss
            if (isDismissing) return
            isDismissing = true
            emitWillDismissEvents()
            dialog.dismiss()
            return
          }

          if (!isPresented) return

          when (newState) {
            BottomSheetBehavior.STATE_DRAGGING -> handleDragBegin(sheetView)

            BottomSheetBehavior.STATE_EXPANDED,
            BottomSheetBehavior.STATE_COLLAPSED,
            BottomSheetBehavior.STATE_HALF_EXPANDED -> {
              if (isReconfiguring) return

              getDetentInfoForState(newState)?.let { detentInfo ->
                if (isDragging) {
                  val detent = getDetentValueForIndex(detentInfo.index)
                  delegate?.viewControllerDidDragEnd(detentInfo.index, detentInfo.position, detent)

                  // Dismiss keyboard if dragged down to a lower detent
                  if (detentInfo.index < dragStartDetentIndex) {
                    val imm = reactContext.getSystemService(android.content.Context.INPUT_METHOD_SERVICE) as? android.view.inputmethod.InputMethodManager
                    imm?.hideSoftInputFromWindow((dialog?.currentFocus ?: bottomSheetView)?.windowToken, 0)
                  }

                  if (detentInfo.index != currentDetentIndex) {
                    presentPromise?.invoke()
                    presentPromise = null
                    currentDetentIndex = detentInfo.index
                    preKeyboardDetentIndex = -1
                    isKeyboardTransition = false
                    setupDimmedBackground(detentInfo.index)
                    delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
                  }

                  isDragging = false
                  isKeyboardTransition = false
                } else {
                  if (detentInfo.index != currentDetentIndex) {
                    currentDetentIndex = detentInfo.index
                    // Skip emitting change event for keyboard-triggered detent changes
                    if (!isKeyboardTransition) {
                      val detent = getDetentValueForIndex(detentInfo.index)
                      delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
                    }
                  }
                  isKeyboardTransition = false
                }
              }
            }

            else -> {}
          }
        }
      }
    )
  }

  private fun setupModalObserver() {
    rnScreensObserver = RNScreensFragmentObserver(
      reactContext = reactContext,
      onModalPresented = {
        if (isPresented && isDialogVisible) {
          isDialogVisible = false
          wasHiddenByModal = true

          bottomSheetView?.animate()
            ?.alpha(0f)
            ?.setDuration(200)
            ?.start()
          dimView?.visibility = INVISIBLE
          parentDimView?.visibility = INVISIBLE
          dialog?.window?.setFlags(
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
          )
        }
      },
      onModalDismissed = {
        // Only show if we were the one hidden by modal, not by sheet stacking
        if (isPresented && wasHiddenByModal) {
          isDialogVisible = true
          wasHiddenByModal = false

          dialog?.window?.clearFlags(
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
          )
          bottomSheetView?.alpha = 1f
          dimView?.visibility = VISIBLE
          parentDimView?.visibility = VISIBLE
        }
      }
    )
    rnScreensObserver?.start()
  }

  private fun cleanupModalObserver() {
    rnScreensObserver?.stop()
    rnScreensObserver = null
  }

  private fun emitWillPresentEvents() {
    val (index, position, detent) = getDetentInfoWithValue(currentDetentIndex)
    parentSheetView?.viewControllerWillBlur()
    delegate?.viewControllerWillPresent(index, position, detent)
    delegate?.viewControllerWillFocus()
  }

  private fun emitWillDismissEvents() {
    delegate?.viewControllerWillBlur()
    delegate?.viewControllerWillDismiss()
    parentSheetView?.viewControllerWillFocus()
  }

  private fun emitDidDismissEvents() {
    val hadParent = parentSheetView != null
    parentSheetView?.viewControllerDidFocus()
    parentSheetView = null

    delegate?.viewControllerDidBlur()
    delegate?.viewControllerDidDismiss(hadParent)

    dismissPromise?.invoke()
    dismissPromise = null
  }

  /** Helper to get detent info with its screen fraction value. */
  private fun getDetentInfoWithValue(index: Int): Triple<Int, Float, Float> {
    val detentInfo = getDetentInfoForIndex(index)
    val detent = getDetentValueForIndex(detentInfo.index)
    return Triple(detentInfo.index, detentInfo.position, detent)
  }

  // ====================================================================
  // MARK: - Dialog Visibility (for stacking)
  // ====================================================================

  val isExpanded: Boolean
    get() {
      val sheetTop = bottomSheetView?.top ?: return false
      return sheetTop <= topInset
    }

  val currentTranslationY: Int
    get() = bottomSheetView?.translationY?.toInt() ?: 0

  fun getExpectedSheetTop(detentIndex: Int): Int {
    if (detentIndex < 0 || detentIndex >= detents.size) return screenHeight
    return realScreenHeight - getDetentHeight(detents[detentIndex])
  }

  /** Translates the sheet when stacking. Pass 0 to reset. */
  fun translateDialog(translationY: Int) {
    val bottomSheet = bottomSheetView ?: return

    bottomSheet.animate()
      .translationY(translationY.toFloat())
      .setDuration(TRANSLATE_ANIMATION_DURATION)
      .setUpdateListener {
        val effectiveTop = bottomSheet.top + bottomSheet.translationY.toInt()
        emitChangePositionDelegate(effectiveTop)
      }
      .start()
  }

  // ====================================================================
  // MARK: - Presentation
  // ====================================================================

  fun present(detentIndex: Int, animated: Boolean = true) {
    val dialog = this.dialog ?: run {
      RNLog.w(reactContext, "TrueSheet: No dialog available. Ensure the sheet is mounted before presenting.")
      return
    }

    setupDimmedBackground(detentIndex)

    if (isPresented) {
      setStateForDetentIndex(detentIndex)
    } else {
      shouldAnimatePresent = animated
      currentDetentIndex = detentIndex
      isDragging = false

      emitWillPresentEvents()

      setupSheetDetents()
      setStateForDetentIndex(detentIndex)
      setupBackground()
      setupGrabber()

      // Hide bottomSheetView to avoid flash
      bottomSheetView?.visibility = INVISIBLE

      dialog.show()
    }
  }

  fun dismiss(animated: Boolean = true) {
    if (isDismissing) return

    isDismissing = true
    emitWillDismissEvents()

    if (animated) {
      animateDismiss {
        dialog?.dismiss()
      }
    } else {
      emitChangePositionDelegate(realScreenHeight)
      dialog?.dismiss()
    }
  }

  // ====================================================================
  // MARK: - Sheet Configuration
  // ====================================================================

  fun setupSheetDetents() {
    val behavior = this.behavior ?: return

    isReconfiguring = true
    val edgeToEdgeTopInset: Int = if (!edgeToEdgeFullScreen) topInset else 0

    behavior.apply {
      isFitToContents = false
      maxWidth = DEFAULT_MAX_WIDTH.dpToPx().toInt()

      val maxAvailableHeight = realScreenHeight - edgeToEdgeTopInset

      setPeekHeight(getDetentHeight(detents[0]), isPresented)

      val halfExpandedDetentHeight = when (detents.size) {
        1 -> peekHeight
        else -> getDetentHeight(detents[1])
      }

      val maxDetentHeight = getDetentHeight(detents.last())

      val adjustedHalfExpandedHeight = minOf(halfExpandedDetentHeight, maxAvailableHeight)
      halfExpandedRatio = minOf(adjustedHalfExpandedHeight.toFloat() / realScreenHeight.toFloat(), MAX_HALF_EXPANDED_RATIO)

      expandedOffset = maxOf(edgeToEdgeTopInset, realScreenHeight - maxDetentHeight)
      isFitToContents = detents.size < 3 && expandedOffset == 0

      val offset = if (expandedOffset == 0) topInset else 0
      val newHeight = realScreenHeight - expandedOffset - offset
      val newWidth = minOf(screenWidth, maxWidth)

      if (lastStateWidth != newWidth || lastStateHeight != newHeight) {
        lastStateWidth = newWidth
        lastStateHeight = newHeight
        delegate?.viewControllerDidChangeSize(newWidth, newHeight)
      }

      if (isPresented) {
        setStateForDetentIndex(currentDetentIndex)
      }

      isReconfiguring = false
    }
  }

  fun setupSheetDetentsForSizeChange() {
    setupSheetDetents()
    positionFooter()
  }

  fun setupGrabber() {
    val bottomSheet = bottomSheetView ?: return

    bottomSheet.findViewWithTag<View>(GRABBER_TAG)?.let {
      bottomSheet.removeView(it)
    }

    if (!grabber || !draggable) return

    val grabberView = TrueSheetGrabberView(reactContext, grabberOptions).apply {
      tag = GRABBER_TAG
    }

    bottomSheet.addView(grabberView)
  }

  private var keyboardObserver: TrueSheetKeyboardObserver? = null

  fun setupKeyboardObserver() {
    val bottomSheet = bottomSheetView ?: return
    keyboardObserver = TrueSheetKeyboardObserver(bottomSheet, reactContext).apply {
      delegate = object : TrueSheetKeyboardObserverDelegate {
        override fun keyboardWillShow(height: Int) {
          // Save current detent and expand to last detent when keyboard shows
          if (detents.size > 1 && currentDetentIndex < detents.lastIndex) {
            preKeyboardDetentIndex = currentDetentIndex
            isKeyboardTransition = true
            setStateForDetentIndex(detents.lastIndex, resetKeyboardState = false)
          }
        }

        override fun keyboardWillHide() {
          // Restore to original detent when keyboard hides
          if (preKeyboardDetentIndex >= 0) {
            isKeyboardTransition = true
            setStateForDetentIndex(preKeyboardDetentIndex)
          }
        }

        override fun keyboardDidChangeHeight(height: Int) {
          translateForKeyboard(height)
        }
      }
      start()
    }
  }

  private fun translateForKeyboard(height: Int) {
    val bottomSheet = bottomSheetView ?: return

    applyClampedTranslation(bottomSheet, -height.toFloat())

    val effectiveTop = bottomSheet.top + bottomSheet.translationY.toInt()
    emitChangePositionDelegate(effectiveTop)
    positionFooter()
    updateDimAmount(effectiveTop)
  }

  /**
   * Applies translationY to the sheet, clamping so the effective top
   * (top + translationY) never goes above topInset.
   */
  private fun applyClampedTranslation(sheetView: View, targetTranslation: Float) {
    if (targetTranslation >= 0) {
      sheetView.translationY = targetTranslation
      return
    }

    val maxTranslation = maxOf(0, sheetView.top - topInset)
    val clampedOffset = minOf(-targetTranslation.toInt(), maxTranslation)
    sheetView.translationY = -clampedOffset.toFloat()
  }

  fun cleanupKeyboardObserver() {
    keyboardObserver?.stop()
    keyboardObserver = null
  }

  private fun finishPresent() {
    val (index, position, detent) = getDetentInfoWithValue(currentDetentIndex)
    delegate?.viewControllerDidPresent(index, position, detent)
    parentSheetView?.viewControllerDidBlur()
    delegate?.viewControllerDidFocus()

    presentPromise?.invoke()
    presentPromise = null
  }


  private fun animatePresent(onEnd: () -> Unit) {
    val bottomSheet = bottomSheetView ?: run {
      onEnd()
      return
    }

    val toTop = getExpectedSheetTop(currentDetentIndex)
    val fromY = (realScreenHeight - toTop).toFloat()

    presentAnimator?.cancel()
    presentAnimator = ValueAnimator.ofFloat(1f, 0f).apply {
      duration = PRESENT_ANIMATION_DURATION
      interpolator = android.view.animation.DecelerateInterpolator()

      addUpdateListener { animator ->
        val fraction = animator.animatedValue as Float
        bottomSheet.translationY = fromY * fraction

        val effectiveTop = bottomSheet.top + bottomSheet.translationY.toInt()
        emitChangePositionDelegate(effectiveTop)
        positionFooter()
        updateDimAmount(effectiveTop)
      }

      addListener(object : AnimatorListenerAdapter() {
        override fun onAnimationEnd(animation: android.animation.Animator) {
          bottomSheet.translationY = 0f
          presentAnimator = null
          onEnd()
        }

        override fun onAnimationCancel(animation: android.animation.Animator) {
          presentAnimator = null
          onEnd()
        }
      })

      start()
    }
  }

  private fun animateDismiss(onEnd: () -> Unit) {
    val bottomSheet = bottomSheetView ?: run {
      onEnd()
      return
    }

    val fromTop = bottomSheet.top + bottomSheet.translationY.toInt()
    val toY = (realScreenHeight - fromTop).toFloat()

    dismissAnimator?.cancel()
    dismissAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
      duration = DISMISS_ANIMATION_DURATION
      interpolator = android.view.animation.AccelerateInterpolator()

      addUpdateListener { animator ->
        val fraction = animator.animatedValue as Float
        bottomSheet.translationY = toY * fraction

        val effectiveTop = bottomSheet.top + bottomSheet.translationY.toInt()
        emitChangePositionDelegate(effectiveTop)
        positionFooter()
        updateDimAmount(effectiveTop)
      }

      addListener(object : AnimatorListenerAdapter() {
        override fun onAnimationEnd(animation: android.animation.Animator) {
          dismissAnimator = null
          onEnd()
        }

        override fun onAnimationCancel(animation: android.animation.Animator) {
          dismissAnimator = null
          onEnd()
        }
      })

      start()
    }
  }

  private fun emitChangePositionDelegate(currentTop: Int, realtime: Boolean = true) {
    if (currentTop == lastEmittedPositionPx) return

    lastEmittedPositionPx = currentTop
    val visibleHeight = realScreenHeight - currentTop
    val position = getPositionDp(visibleHeight)
    val interpolatedIndex = getInterpolatedIndexForPosition(currentTop)
    val detent = getInterpolatedDetentForPosition(currentTop)
    delegate?.viewControllerDidChangePosition(interpolatedIndex, position, detent, realtime)
  }

  fun setupBackground() {
    val bottomSheet = bottomSheetView ?: return

    val outerRadii = floatArrayOf(
      sheetCornerRadius,
      sheetCornerRadius,
      sheetCornerRadius,
      sheetCornerRadius,
      0f,
      0f,
      0f,
      0f
    )
    val backgroundColor = sheetBackgroundColor ?: getDefaultBackgroundColor()

    bottomSheet.background = ShapeDrawable(RoundRectShape(outerRadii, null, null)).apply {
      paint.color = backgroundColor
    }
    bottomSheet.clipToOutline = true
  }

  fun setupDimmedBackground(detentIndex: Int) {
    val dialog = this.dialog ?: return

    dialog.window?.apply {
      val touchOutside = findViewById<View>(com.google.android.material.R.id.touch_outside)
      clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)

      val shouldDimAtDetent = dimmed && detentIndex >= dimmedDetentIndex

      if (dimmed) {
        val parentDimVisible = (parentSheetView?.viewController?.dimView?.alpha ?: 0f) > 0f

        if (dimView == null) dimView = TrueSheetDimView(reactContext)
        if (!parentDimVisible) dimView?.attach(null)

        val parentController = parentSheetView?.viewController
        val parentBottomSheet = parentController?.bottomSheetView
        if (parentBottomSheet != null) {
          if (parentDimView == null) parentDimView = TrueSheetDimView(reactContext)
          parentDimView?.attach(parentBottomSheet, parentController.sheetCornerRadius)
        }
      } else {
        dimView?.detach()
        dimView = null
        parentDimView?.detach()
        parentDimView = null
      }

      if (shouldDimAtDetent) {
        touchOutside.setOnTouchListener { _, event ->
          if (event.action == MotionEvent.ACTION_UP && dismissible) {
            dismiss()
          }
          true
        }
      } else {
        touchOutside.setOnTouchListener { v, event ->
          event.setLocation(event.rawX - v.x, event.rawY - v.y)
          (
            parentSheetView?.viewController?.dialog?.window?.decorView
              ?: reactContext.currentActivity?.window?.decorView
            )?.dispatchTouchEvent(event)
          false
        }
        dialog.setCanceledOnTouchOutside(false)
      }
    }
  }

  fun updateDimAmount(sheetTop: Int? = null) {
    if (!dimmed) return
    val top = sheetTop ?: bottomSheetView?.top ?: return
    dimView?.interpolateAlpha(top, dimmedDetentIndex, ::getSheetTopForDetentIndex)
    parentDimView?.interpolateAlpha(top, dimmedDetentIndex, ::getSheetTopForDetentIndex)
  }

  /** Positions footer at bottom of visible sheet area. */
  fun positionFooter(slideOffset: Float? = null) {
    val footerView = containerView?.footerView ?: return
    val bottomSheet = bottomSheetView ?: return

    val footerHeight = footerView.height
    val sheetHeight = bottomSheet.height
    val sheetTop = bottomSheet.top

    footerView.translationY = bottomSheet.translationY

    var footerY = (sheetHeight - sheetTop - footerHeight).toFloat()
    if (slideOffset != null && slideOffset < 0) {
      footerY -= (footerHeight * slideOffset)
    }

    val maxAllowedY = (sheetHeight - topInset - footerHeight).toFloat()
    footerView.y = minOf(footerY, maxAllowedY)
  }

  fun setStateForDetentIndex(index: Int, resetKeyboardState: Boolean = true) {
    if (resetKeyboardState) {
      preKeyboardDetentIndex = -1
    }
    behavior?.state = getStateForDetentIndex(index)
  }

  fun getDefaultBackgroundColor(): Int {
    val typedValue = TypedValue()
    return if (reactContext.theme.resolveAttribute(
        com.google.android.material.R.attr.colorSurfaceContainerLow,
        typedValue,
        true
      )
    ) {
      typedValue.data
    } else {
      Color.WHITE
    }
  }

  // ====================================================================
  // MARK: - Position & Drag Handling
  // ====================================================================

  /**
   * Calculate the visible sheet height from a sheet view.
   * Uses real screen height for consistency across API levels.
   */
  private fun getVisibleSheetHeight(sheetView: View): Int = realScreenHeight - sheetView.top

  private fun getPositionDp(visibleSheetHeight: Int): Float = (screenHeight - visibleSheetHeight).pxToDp()

  /**
   * Get the expected sheetTop position for a detent index.
   */
  private fun getSheetTopForDetentIndex(index: Int): Int {
    if (index < 0 || index >= detents.size) return realScreenHeight
    return realScreenHeight - getDetentHeight(detents[index])
  }

  /** Returns (fromIndex, toIndex, progress) for interpolation, or null if < 2 detents. */
  private fun findSegmentForPosition(positionPx: Int): Triple<Int, Int, Float>? {
    val count = detents.size
    if (count == 0) return null

    val firstPos = getSheetTopForDetentIndex(0)

    if (positionPx > firstPos) {
      val range = realScreenHeight - firstPos
      val progress = if (range > 0) (positionPx - firstPos).toFloat() / range else 0f
      return Triple(-1, 0, progress)
    }

    if (count == 1) return Triple(0, 0, 0f)

    val lastPos = getSheetTopForDetentIndex(count - 1)
    if (positionPx < lastPos) {
      return Triple(count - 1, count - 1, 0f)
    }

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

  /** Returns continuous index (e.g., 0.5 = halfway between detent 0 and 1). */
  private fun getInterpolatedIndexForPosition(positionPx: Int): Float {
    val count = detents.size
    if (count == 0) return -1f

    val segment = findSegmentForPosition(positionPx) ?: return 0f
    val (fromIndex, _, progress) = segment

    if (fromIndex == -1) return -progress
    return fromIndex + progress
  }

  /** Returns interpolated screen fraction for position. */
  private fun getInterpolatedDetentForPosition(positionPx: Int): Float {
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

  /** Returns raw screen fraction for index (without bottomInset). */
  private fun getDetentValueForIndex(index: Int): Float {
    if (index < 0 || index >= detents.size) return 0f
    val value = detents[index]
    return if (value == -1.0) {
      (contentHeight + headerHeight).toFloat() / screenHeight.toFloat()
    } else {
      value.toFloat()
    }
  }

  private fun getCurrentDetentInfo(sheetView: View): DetentInfo {
    val position = getPositionDp(getVisibleSheetHeight(sheetView))
    return DetentInfo(currentDetentIndex, position)
  }

  private fun handleDragBegin(sheetView: View) {
    val detentInfo = getCurrentDetentInfo(sheetView)
    val detent = getDetentValueForIndex(detentInfo.index)
    delegate?.viewControllerDidDragBegin(detentInfo.index, detentInfo.position, detent)
    dragStartDetentIndex = currentDetentIndex
    isDragging = true
  }

  private fun handleDragChange(sheetView: View) {
    if (!isDragging) return
    val detentInfo = getCurrentDetentInfo(sheetView)
    val detent = getDetentValueForIndex(detentInfo.index)
    delegate?.viewControllerDidDragChange(detentInfo.index, detentInfo.position, detent)
  }

  // ====================================================================
  // MARK: - Detent Calculations
  // ====================================================================

  private fun getDetentHeight(detent: Double): Int {
    val height = if (detent == -1.0) {
      contentHeight + headerHeight + contentBottomInset
    } else {
      if (detent <= 0.0 || detent > 1.0) {
        throw IllegalArgumentException("TrueSheet: detent fraction ($detent) must be between 0 and 1")
      }
      (detent * screenHeight).toInt() + contentBottomInset
    }

    val maxAllowedHeight = screenHeight + contentBottomInset
    return maxSheetHeight?.let { minOf(height, it, maxAllowedHeight) } ?: minOf(height, maxAllowedHeight)
  }

  /** Maps detent index to BottomSheetBehavior state based on detent count. */
  private fun getStateForDetentIndex(index: Int): Int {
    val stateMap = getDetentStateMap() ?: return BottomSheetBehavior.STATE_HIDDEN
    return stateMap.entries.find { it.value == index }?.key ?: BottomSheetBehavior.STATE_HIDDEN
  }

  /** Maps BottomSheetBehavior state to DetentInfo based on detent count. */
  fun getDetentInfoForState(state: Int): DetentInfo? {
    val stateMap = getDetentStateMap() ?: return null
    val index = stateMap[state] ?: return null
    return DetentInfo(index, getPositionForDetentIndex(index))
  }

  /** Returns state-to-index mapping based on detent count. */
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

  private fun getPositionForDetentIndex(index: Int): Float {
    if (index < 0 || index >= detents.size) return screenHeight.pxToDp()

    bottomSheetView?.let {
      val visibleSheetHeight = getVisibleSheetHeight(it)
      if (visibleSheetHeight > 0 && visibleSheetHeight < realScreenHeight) {
        return getPositionDp(visibleSheetHeight)
      }
    }

    val detentHeight = getDetentHeight(detents[index])
    return getPositionDp(detentHeight)
  }

  fun getDetentInfoForIndex(index: Int) = getDetentInfoForState(getStateForDetentIndex(index)) ?: DetentInfo(0, 0f)

  // ====================================================================
  // MARK: - RootView Implementation
  // ====================================================================

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)
    (getTag(R.id.react_test_id) as? String)?.let { info.viewIdResourceName = it }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w == oldw && h == oldh) return
    if (!isPresented) return

    // Skip continuous size changes when fullScreen + edge-to-edge
    if (h + topInset >= screenHeight && isExpanded && oldw == w) return

    this.post {
      setupSheetDetents()
      positionFooter()
      bottomSheetView?.let { emitChangePositionDelegate(it.top, realtime = false) }
    }
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  // ====================================================================
  // MARK: - Touch Event Handling
  // ====================================================================

  /** Forwards touch events to footer positioned outside normal hierarchy. */
  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    val footer = containerView?.footerView
    if (footer != null && footer.isVisible) {
      val footerLocation = ScreenUtils.getScreenLocation(footer)
      val touchScreenX = event.rawX.toInt()
      val touchScreenY = event.rawY.toInt()

      if (touchScreenX >= footerLocation[0] &&
        touchScreenX <= footerLocation[0] + footer.width &&
        touchScreenY >= footerLocation[1] &&
        touchScreenY <= footerLocation[1] + footer.height
      ) {
        val localEvent = MotionEvent.obtain(event)
        localEvent.setLocation(
          (touchScreenX - footerLocation[0]).toFloat(),
          (touchScreenY - footerLocation[1]).toFloat()
        )
        val handled = footer.dispatchTouchEvent(localEvent)
        localEvent.recycle()
        if (handled) return true
      }
    }
    return super.dispatchTouchEvent(event)
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let {
      jSTouchDispatcher.handleTouchEvent(event, it, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, it, true)
    }
    return super.onInterceptTouchEvent(event)
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let {
      jSTouchDispatcher.handleTouchEvent(event, it, reactContext)
      jSPointerDispatcher?.handleMotionEvent(event, it, false)
    }
    super.onTouchEvent(event)
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, true) }
    return super.onHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jSPointerDispatcher?.handleMotionEvent(event, it, false) }
    return super.onHoverEvent(event)
  }

  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let {
      jSTouchDispatcher.onChildStartedNativeGesture(ev, it)
      jSPointerDispatcher?.onChildStartedNativeGesture(childView, ev, it)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jSTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jSPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    super.requestDisallowInterceptTouchEvent(disallowIntercept)
  }
}
