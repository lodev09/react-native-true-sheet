package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
import android.util.Log
import android.util.TypedValue
import android.view.MotionEvent
import android.animation.ValueAnimator
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.FrameLayout
import androidx.core.view.ViewCompat
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

    // Animation durations from res/anim/true_sheet_slide_in.xml and true_sheet_slide_out.xml
    private const val PRESENT_ANIMATION_DURATION = 250L
    private const val DISMISS_ANIMATION_DURATION = 150L
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
  private var windowAnimation: Int = 0
  private var lastEmittedPositionPx: Int = -1

  /** Tracks if this sheet was hidden due to a RN Screens modal (vs sheet stacking) */
  private var wasHiddenByModal = false

  var presentPromise: (() -> Unit)? = null
  var dismissPromise: (() -> Unit)? = null

  // Reference to parent TrueSheetView (if presented from another sheet)
  var parentSheetView: TrueSheetView? = null

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
      setupBackground()
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
        windowAnimation = attributes.windowAnimations
        // Disable default keyboard avoidance - sheet handles it via setupKeyboardObserver
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
  }

  private fun setupDialogListeners(dialog: BottomSheetDialog) {
    dialog.setOnShowListener {
      isPresented = true
      isDialogVisible = true
      resetAnimation()
      setupBackground()
      setupGrabber()
      setupKeyboardObserver()

      val toTop = getExpectedSheetTop(currentDetentIndex)
      setupTransitionTracker(realScreenHeight, toTop, PRESENT_ANIMATION_DURATION)
      animateDimAlpha(show = true)

      sheetContainer?.post {
        positionFooter()
      }

      sheetContainer?.postDelayed({
        val (index, position, detent) = getDetentInfoWithValue(currentDetentIndex)

        delegate?.viewControllerDidPresent(index, position, detent)
        parentSheetView?.viewControllerDidBlur()
        delegate?.viewControllerDidFocus()

        presentPromise?.invoke()
        presentPromise = null
      }, PRESENT_ANIMATION_DURATION)
    }

    dialog.setOnCancelListener {
      if (isDismissing) return@setOnCancelListener

      isDismissing = true
      val fromTop = bottomSheetView?.top ?: getExpectedSheetTop(currentDetentIndex)
      setupTransitionTracker(fromTop, realScreenHeight, DISMISS_ANIMATION_DURATION)
      animateDimAlpha(show = false)
      emitWillDismissEvents()
    }

    dialog.setOnDismissListener {
      android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
        emitDidDismissEvents()
        cleanupDialog()
      }, DISMISS_ANIMATION_DURATION)
    }
  }

  private fun setupBottomSheetBehavior(dialog: BottomSheetDialog) {
    dialog.behavior.addBottomSheetCallback(
      object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onSlide(sheetView: View, slideOffset: Float) {
          val behavior = behavior ?: return

          emitChangePositionDelegate(sheetView, realtime = true)

          when (behavior.state) {
            BottomSheetBehavior.STATE_DRAGGING,
            BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

            else -> { }
          }

          positionFooter(slideOffset)
          updateDimAmount()
        }

        override fun onStateChanged(sheetView: View, newState: Int) {
          if (newState == BottomSheetBehavior.STATE_HIDDEN) {
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

                  if (detentInfo.index != currentDetentIndex) {
                    presentPromise?.invoke()
                    presentPromise = null
                    currentDetentIndex = detentInfo.index
                    setupDimmedBackground(detentInfo.index)
                    delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
                  }

                  isDragging = false
                } else if (detentInfo.index != currentDetentIndex) {
                  val detent = getDetentValueForIndex(detentInfo.index)
                  currentDetentIndex = detentInfo.index
                  delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
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
          dialog?.window?.setWindowAnimations(com.lodev09.truesheet.R.style.TrueSheetFadeOutAnimation)
          dialog?.window?.decorView?.visibility = INVISIBLE
          wasHiddenByModal = true
        }
      },
      onModalDismissed = {
        // Only show if we were the one hidden by modal, not by sheet stacking
        if (isPresented && wasHiddenByModal) {
          isDialogVisible = true
          dialog?.window?.decorView?.visibility = VISIBLE
          // Restore animation after visibility change to avoid slide animation
          sheetContainer?.post {
            dialog?.window?.setWindowAnimations(windowAnimation)
          }
          wasHiddenByModal = false
        }
      }
    )
    rnScreensObserver?.start()
  }

  private fun cleanupModalObserver() {
    rnScreensObserver?.stop()
    rnScreensObserver = null
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

  val currentSheetTop: Int
    get() = bottomSheetView?.top ?: screenHeight

  fun getExpectedSheetTop(detentIndex: Int): Int {
    if (detentIndex < 0 || detentIndex >= detents.size) return screenHeight
    return realScreenHeight - getDetentHeight(detents[detentIndex])
  }

  /** Translates the sheet when stacking. Pass 0 to reset. */
  fun translateDialog(translationY: Int) {
    val bottomSheet = bottomSheetView ?: return
    val duration = if (translationY > 0) PRESENT_ANIMATION_DURATION else DISMISS_ANIMATION_DURATION

    bottomSheet.animate()
      .translationY(translationY.toFloat())
      .setDuration(duration)
      .setUpdateListener {
        val effectiveTop = bottomSheet.top + bottomSheet.translationY.toInt()
        if (effectiveTop == lastEmittedPositionPx) return@setUpdateListener

        lastEmittedPositionPx = effectiveTop
        val visibleHeight = realScreenHeight - effectiveTop
        val position = getPositionDp(visibleHeight)
        val interpolatedIndex = getInterpolatedIndexForPosition(effectiveTop)
        val detent = getInterpolatedDetentForPosition(effectiveTop)
        delegate?.viewControllerDidChangePosition(interpolatedIndex, position, detent, true)
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
      currentDetentIndex = detentIndex
      isDragging = false
      setupSheetDetents()
      setStateForDetentIndex(detentIndex)

      val (index, position, detent) = getDetentInfoWithValue(detentIndex)

      parentSheetView?.viewControllerWillBlur()
      delegate?.viewControllerWillPresent(index, position, detent)
      delegate?.viewControllerWillFocus()

      if (!animated) {
        dialog.window?.setWindowAnimations(0)
      }

      dialog.show()
    }
  }

  fun dismiss(animated: Boolean = true) {
    if (isDismissing) return

    isDismissing = true
    val fromTop = bottomSheetView?.top ?: getExpectedSheetTop(currentDetentIndex)
    setupTransitionTracker(fromTop, realScreenHeight, DISMISS_ANIMATION_DURATION)
    emitWillDismissEvents()

    if (!animated) {
      dialog?.window?.setWindowAnimations(0)
      post { dialog?.dismiss() }
    } else {
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
  private var positionAnimator: ValueAnimator? = null

  fun setupKeyboardObserver() {
    val bottomSheet = bottomSheetView ?: return
    keyboardObserver = TrueSheetKeyboardObserver(bottomSheet, reactContext).apply {
      delegate = object : TrueSheetKeyboardObserverDelegate {
        override fun keyboardHeightDidChange(height: Int) {
          setupSheetDetents()
        }
      }
      start()
    }
  }

  fun cleanupKeyboardObserver() {
    keyboardObserver?.stop()
    keyboardObserver = null
  }

  private fun setupTransitionTracker(fromTop: Int, toTop: Int, duration: Long) {
    positionAnimator?.cancel()
    positionAnimator = ValueAnimator.ofInt(fromTop, toTop).apply {
      this.duration = duration
      interpolator = if (fromTop > toTop) {
        android.view.animation.DecelerateInterpolator(2f) // present
      } else {
        android.view.animation.AccelerateInterpolator(2f) // dismiss
      }
      addUpdateListener { animator ->
        val currentTop = animator.animatedValue as Int
        if (currentTop == lastEmittedPositionPx) return@addUpdateListener

        lastEmittedPositionPx = currentTop
        val visibleHeight = realScreenHeight - currentTop
        val position = getPositionDp(visibleHeight)
        val interpolatedIndex = getInterpolatedIndexForPosition(currentTop)
        val detent = getInterpolatedDetentForPosition(currentTop)
        delegate?.viewControllerDidChangePosition(interpolatedIndex, position, detent, true)
      }
      addListener(object : android.animation.AnimatorListenerAdapter() {
        override fun onAnimationEnd(animation: android.animation.Animator) {
          positionAnimator = null
        }
      })
      start()
    }
  }

  fun setupBackground() {
    val bottomSheet = bottomSheetView ?: return

    val outerRadii = floatArrayOf(
      sheetCornerRadius, sheetCornerRadius, sheetCornerRadius, sheetCornerRadius, 0f, 0f, 0f, 0f
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
        touchOutside.setOnTouchListener(null)
        dialog.setCanceledOnTouchOutside(dismissible)
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

  fun resetAnimation() {
    dialog?.window?.setWindowAnimations(windowAnimation)
  }

  private fun animateDimAlpha(show: Boolean) {
    if (!dimmed) return
    val duration = if (show) PRESENT_ANIMATION_DURATION else DISMISS_ANIMATION_DURATION
    dimView?.animateAlpha(show, duration, dimmedDetentIndex, currentDetentIndex)
    parentDimView?.animateAlpha(show, duration, dimmedDetentIndex, currentDetentIndex)
  }

  fun updateDimAmount() {
    if (!dimmed) return
    val sheetTop = bottomSheetView?.top ?: return
    dimView?.interpolateAlpha(sheetTop, dimmedDetentIndex, ::getSheetTopForDetentIndex)
    parentDimView?.interpolateAlpha(sheetTop, dimmedDetentIndex, ::getSheetTopForDetentIndex)
  }

  /** Positions footer at bottom of sheet, adjusting during drag via slideOffset. */
  fun positionFooter(slideOffset: Float? = null) {
    val footerView = containerView?.footerView ?: return
    val bottomSheet = bottomSheetView ?: return

    val footerHeight = footerView.height
    val sheetHeight = bottomSheet.height
    val sheetTop = bottomSheet.top

    // Footer Y relative to sheet: place at bottom of sheet container minus footer height
    var footerY = (sheetHeight - sheetTop - footerHeight - keyboardHeight).toFloat()

    if (slideOffset != null && slideOffset < 0) {
      footerY -= (footerHeight * slideOffset)
    }

    // Clamp to prevent footer from going above visible area
    val maxAllowedY = (sheetHeight - topInset - footerHeight).toFloat()
    footerView.y = minOf(footerY, maxAllowedY)
  }

  fun setStateForDetentIndex(index: Int) {
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

  private fun emitChangePositionDelegate(sheetView: View, realtime: Boolean) {
    if (sheetView.top == lastEmittedPositionPx) return

    lastEmittedPositionPx = sheetView.top
    val position = getPositionDp(getVisibleSheetHeight(sheetView))
    val interpolatedIndex = getInterpolatedIndexForPosition(sheetView.top)
    val detent = getInterpolatedDetentForPosition(sheetView.top)
    delegate?.viewControllerDidChangePosition(interpolatedIndex, position, detent, realtime)
  }

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

    // Above first detent - interpolating toward closed
    if (positionPx > firstPos) {
      val range = realScreenHeight - firstPos
      val progress = if (range > 0) (positionPx - firstPos).toFloat() / range else 0f
      return Triple(-1, 0, progress)
    }

    // Single detent - at or above the detent
    if (count == 1) return Triple(0, 0, 0f)

    val lastPos = getSheetTopForDetentIndex(count - 1)

    // Below last detent
    if (positionPx < lastPos) {
      return Triple(count - 1, count - 1, 0f)
    }

    // Between detents
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

  private val keyboardHeight: Int
    get() = keyboardObserver?.currentHeight ?: 0

  private fun getDetentHeight(detent: Double): Int {
    val height = if (detent == -1.0) {
      contentHeight + headerHeight + contentBottomInset + keyboardHeight
    } else {
      if (detent <= 0.0 || detent > 1.0) {
        throw IllegalArgumentException("TrueSheet: detent fraction ($detent) must be between 0 and 1")
      }
      (detent * screenHeight).toInt() + contentBottomInset + keyboardHeight
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
      if (visibleSheetHeight > 0) return getPositionDp(visibleSheetHeight)
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
    if (h + topInset >= screenHeight && isExpanded && oldw == w) {
      return
    }

    this.post {
      setupSheetDetents()
      positionFooter()
      bottomSheetView?.let { emitChangePositionDelegate(it, realtime = false) }
    }
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  // ====================================================================
  // MARK: - Touch Event Handling
  // ====================================================================

  /** Forwards touch events to footer which is positioned outside normal hierarchy. */
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
