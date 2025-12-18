package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.graphics.Color
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.RoundRectShape
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
import com.lodev09.truesheet.core.TrueSheetAnimator
import com.lodev09.truesheet.core.TrueSheetAnimatorProvider
import com.lodev09.truesheet.core.TrueSheetDetentCalculator
import com.lodev09.truesheet.core.TrueSheetDetentMeasurements
import com.lodev09.truesheet.core.TrueSheetDialogObserver
import com.lodev09.truesheet.core.TrueSheetDimView
import com.lodev09.truesheet.core.TrueSheetGrabberView
import com.lodev09.truesheet.core.TrueSheetKeyboardObserver
import com.lodev09.truesheet.core.TrueSheetKeyboardObserverDelegate
import com.lodev09.truesheet.utils.ScreenUtils

// =============================================================================
// MARK: - Data Types & Delegate Protocol
// =============================================================================

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

// =============================================================================
// MARK: - TrueSheetViewController
// =============================================================================

/**
 * Manages the bottom sheet dialog and its presentation lifecycle.
 * Acts as a RootView to properly dispatch touch events to React Native.
 */
@SuppressLint("ClickableViewAccessibility", "ViewConstructor")
class TrueSheetViewController(private val reactContext: ThemedReactContext) :
  ReactViewGroup(reactContext),
  RootView,
  TrueSheetDetentMeasurements,
  TrueSheetAnimatorProvider {

  companion object {
    const val TAG_NAME = "TrueSheet"

    // Prevents fully expanded ratio which causes behavior issues
    private const val GRABBER_TAG = "TrueSheetGrabber"
    private const val DEFAULT_MAX_WIDTH = 640 // dp
    private const val DEFAULT_CORNER_RADIUS = 16 // dp
    private const val TRANSLATE_ANIMATION_DURATION = 200L
  }

  // =============================================================================
  // MARK: - Types
  // =============================================================================

  private sealed class InteractionState {
    data object Idle : InteractionState()
    data class Dragging(val startTop: Int) : InteractionState()
    data object Reconfiguring : InteractionState()
  }

  // =============================================================================
  // MARK: - Properties
  // =============================================================================

  var delegate: TrueSheetViewControllerDelegate? = null

  // Dialog & Views
  private var dialog: BottomSheetDialog? = null
  private var dimView: TrueSheetDimView? = null
  private var parentDimView: TrueSheetDimView? = null

  // Presentation State
  var isPresented = false
    private set

  var isDialogVisible = false
    private set

  var currentDetentIndex: Int = -1
    private set

  private var interactionState: InteractionState = InteractionState.Idle
  private var isDismissing = false
  private var wasHiddenByModal = false
  private var shouldAnimatePresent = true

  private var lastStateWidth: Int = 0
  private var lastStateHeight: Int = 0
  private var lastEmittedPositionPx: Int = -1

  // Keyboard State
  private var detentIndexBeforeKeyboard: Int = -1
  private var isKeyboardTransitioning: Boolean = false

  // Promises
  var presentPromise: (() -> Unit)? = null
  var dismissPromise: (() -> Unit)? = null

  // For stacked sheets
  var parentSheetView: TrueSheetView? = null

  // Helper Objects
  private val sheetAnimator = TrueSheetAnimator(this)
  private var keyboardObserver: TrueSheetKeyboardObserver? = null
  private var rnScreensObserver: RNScreensFragmentObserver? = null
  private val detentCalculator = TrueSheetDetentCalculator(this)

  // Touch Dispatchers
  internal var eventDispatcher: EventDispatcher? = null
  private val jSTouchDispatcher = JSTouchDispatcher(this)
  private var jSPointerDispatcher: JSPointerDispatcher? = null

  // Detent Configuration
  override var maxSheetHeight: Int? = null
  override var detents: MutableList<Double> = mutableListOf(0.5, 1.0)

  // Appearance Configuration
  var dimmed = true
  var dimmedDetentIndex = 0
  var grabber: Boolean = true
  var grabberOptions: GrabberOptions? = null
  var sheetBackgroundColor: Int? = null
  var edgeToEdgeFullScreen: Boolean = false
  var insetAdjustment: String = "automatic"

  var sheetCornerRadius: Float = DEFAULT_CORNER_RADIUS.dpToPx()
    set(value) {
      field = if (value < 0) DEFAULT_CORNER_RADIUS.dpToPx() else value
      if (isPresented) setupBackground()
    }

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

  // =============================================================================
  // MARK: - Computed Properties
  // =============================================================================

  // Dialog
  private val behavior: BottomSheetBehavior<FrameLayout>?
    get() = dialog?.behavior

  private val sheetContainer: FrameLayout?
    get() = this.parent as? FrameLayout

  override val bottomSheetView: FrameLayout?
    get() = dialog?.findViewById(com.google.android.material.R.id.design_bottom_sheet)

  private val containerView: TrueSheetContainerView?
    get() = if (this.isNotEmpty()) getChildAt(0) as? TrueSheetContainerView else null

  // Screen Measurements
  override val screenHeight: Int
    get() = ScreenUtils.getScreenHeight(reactContext)

  val screenWidth: Int
    get() = ScreenUtils.getScreenWidth(reactContext)

  // Includes system bars for accurate positioning
  override val realScreenHeight: Int
    get() = ScreenUtils.getRealScreenHeight(reactContext)

  // Content Measurements
  override val contentHeight: Int
    get() = containerView?.contentHeight ?: 0

  override val headerHeight: Int
    get() = containerView?.headerHeight ?: 0

  // Insets
  // Target keyboard height used for detent calculations
  override val keyboardInset: Int
    get() = keyboardObserver?.targetHeight ?: 0

  // Current animated keyboard height for positioning
  private val currentKeyboardInset: Int
    get() = keyboardObserver?.currentHeight ?: 0

  val bottomInset: Int
    get() = if (edgeToEdgeEnabled) ScreenUtils.getInsets(reactContext).bottom else 0

  val topInset: Int
    get() = if (edgeToEdgeEnabled) ScreenUtils.getInsets(reactContext).top else 0

  override val contentBottomInset: Int
    get() = if (insetAdjustment == "automatic") bottomInset else 0

  private val edgeToEdgeEnabled: Boolean
    get() {
      val defaultEnabled = android.os.Build.VERSION.SDK_INT >= 36
      return BuildConfig.EDGE_TO_EDGE_ENABLED || dialog?.edgeToEdgeEnabled == true || defaultEnabled
    }

  // Sheet State
  val isExpanded: Boolean
    get() {
      val sheetTop = bottomSheetView?.top ?: return false
      return sheetTop <= topInset
    }

  val currentTranslationY: Int
    get() = bottomSheetView?.translationY?.toInt() ?: 0

  private val isTopmostSheet: Boolean
    get() {
      val hostView = delegate as? TrueSheetView ?: return true
      return TrueSheetDialogObserver.isTopmostSheet(hostView)
    }

  // =============================================================================
  // MARK: - Initialization
  // =============================================================================

  init {
    jSPointerDispatcher = JSPointerDispatcher(this)
  }

  // =============================================================================
  // MARK: - Dialog Creation & Cleanup
  // =============================================================================

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
        setWindowAnimations(0)
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
    sheetAnimator.cancel()
    dimView?.detach()
    dimView = null
    parentDimView?.detach()
    parentDimView = null
    sheetContainer?.removeView(this)

    dialog = null
    interactionState = InteractionState.Idle
    isDismissing = false
    isPresented = false
    isDialogVisible = false
    wasHiddenByModal = false
    lastEmittedPositionPx = -1
    shouldAnimatePresent = true
  }

  // =============================================================================
  // MARK: - Dialog Listeners
  // =============================================================================

  private fun setupDialogListeners(dialog: BottomSheetDialog) {
    dialog.setOnShowListener {
      bottomSheetView?.visibility = VISIBLE

      isPresented = true
      isDialogVisible = true

      emitWillPresentEvents()

      setupSheetDetents()
      setupBackground()
      setupGrabber()
      setupKeyboardObserver()

      if (shouldAnimatePresent) {
        val toTop = getExpectedSheetTop(currentDetentIndex)
        sheetAnimator.animatePresent(
          toTop = toTop,
          onUpdate = { effectiveTop ->
            emitChangePositionDelegate(effectiveTop)
            positionFooter()
            updateDimAmount(effectiveTop)
          },
          onEnd = { finishPresent() }
        )
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

          when (behavior.state) {
            BottomSheetBehavior.STATE_DRAGGING,
            BottomSheetBehavior.STATE_SETTLING -> handleDragChange(sheetView)

            else -> { }
          }

          if (!sheetAnimator.isAnimating) {
            emitChangePositionDelegate(sheetView.top)

            if (!isKeyboardTransitioning) {
              positionFooter(slideOffset)
              updateDimAmount(sheetView.top)
            }
          }
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
            BottomSheetBehavior.STATE_HALF_EXPANDED -> handleStateSettled(sheetView, newState)

            else -> {}
          }
        }
      }
    )
  }

  private fun handleStateSettled(sheetView: View, newState: Int) {
    if (interactionState is InteractionState.Reconfiguring) return

    val index = detentCalculator.getDetentIndexForState(newState) ?: return
    val position = detentCalculator.getPositionDp(detentCalculator.getVisibleSheetHeight(sheetView.top))
    val detentInfo = DetentInfo(index, position)

    when (interactionState) {
      is InteractionState.Dragging -> {
        val detent = detentCalculator.getDetentValueForIndex(detentInfo.index)
        delegate?.viewControllerDidDragEnd(detentInfo.index, detentInfo.position, detent)

        if (detentInfo.index != currentDetentIndex) {
          presentPromise?.invoke()
          presentPromise = null
          currentDetentIndex = detentInfo.index
          setupDimmedBackground(detentInfo.index)
          delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
        }

        interactionState = InteractionState.Idle
      }

      else -> {
        if (detentInfo.index != currentDetentIndex) {
          currentDetentIndex = detentInfo.index
          if (!isKeyboardTransitioning) {
            val detent = detentCalculator.getDetentValueForIndex(detentInfo.index)
            delegate?.viewControllerDidChangeDetent(detentInfo.index, detentInfo.position, detent)
          }
        }
      }
    }
  }

  // =============================================================================
  // MARK: - Modal Observer (react-native-screens)
  // =============================================================================

  private fun setupModalObserver() {
    rnScreensObserver = RNScreensFragmentObserver(
      reactContext = reactContext,
      onModalPresented = {
        if (isPresented && isDialogVisible && isTopmostSheet) {
          hideForModal()
        }
      },
      onModalWillDismiss = {
        if (isPresented && wasHiddenByModal && isTopmostSheet) {
          showAfterModal()
        }
      },
      onModalDidDismiss = {
        if (isPresented && wasHiddenByModal) {
          wasHiddenByModal = false
          // Restore parent sheet after this sheet is restored
          parentSheetView?.viewController?.let { parent ->
            post { parent.showAfterModal() }
          }
        }
      }
    )
    rnScreensObserver?.start()
  }

  private fun cleanupModalObserver() {
    rnScreensObserver?.stop()
    rnScreensObserver = null
  }

  private fun hideForModal() {
    isDialogVisible = false
    wasHiddenByModal = true

    // Prepare for fast fade out
    dimView?.alpha = 0f
    parentDimView?.alpha = 0f

    dialog?.window?.setWindowAnimations(com.lodev09.truesheet.R.style.TrueSheetFastFadeOut)
    dialog?.window?.decorView?.visibility = GONE
    dimView?.visibility = INVISIBLE
    parentDimView?.visibility = INVISIBLE

    parentSheetView?.viewController?.hideForModal()
  }

  private fun showAfterModal() {
    isDialogVisible = true

    dialog?.window?.setWindowAnimations(0)
    dialog?.window?.decorView?.visibility = VISIBLE
    dimView?.visibility = VISIBLE
    parentDimView?.visibility = VISIBLE

    updateDimAmount(animated = true)
  }

  // =============================================================================
  // MARK: - Presentation
  // =============================================================================

  fun present(detentIndex: Int, animated: Boolean = true) {
    val dialog = this.dialog ?: run {
      RNLog.w(reactContext, "TrueSheet: No dialog available. Ensure the sheet is mounted before presenting.")
      return
    }

    setupDimmedBackground(detentIndex)
    setStateForDetentIndex(detentIndex)

    if (!isPresented) {
      shouldAnimatePresent = animated
      currentDetentIndex = detentIndex
      interactionState = InteractionState.Idle

      // Position off-screen until animation starts
      bottomSheetView?.translationY = realScreenHeight.toFloat()
      bottomSheetView?.visibility = INVISIBLE

      dialog.show()
    }
  }

  fun dismiss(animated: Boolean = true) {
    if (isDismissing) return

    isDismissing = true
    emitWillDismissEvents()

    if (animated) {
      sheetAnimator.animateDismiss(
        onUpdate = { effectiveTop ->
          emitChangePositionDelegate(effectiveTop)
          positionFooter()
          updateDimAmount(effectiveTop)
        },
        onEnd = { dialog?.dismiss() }
      )
    } else {
      emitChangePositionDelegate(realScreenHeight)
      dialog?.dismiss()
    }
  }

  private fun finishPresent() {
    val (index, position, detent) = getDetentInfoWithValue(currentDetentIndex)
    delegate?.viewControllerDidPresent(index, position, detent)
    parentSheetView?.viewControllerDidBlur()
    delegate?.viewControllerDidFocus()

    presentPromise?.invoke()
    presentPromise = null
  }

  // =============================================================================
  // MARK: - Sheet Configuration
  // =============================================================================

  fun setupSheetDetents() {
    val behavior = this.behavior ?: return

    interactionState = InteractionState.Reconfiguring
    val edgeToEdgeTopInset: Int = if (!edgeToEdgeFullScreen) topInset else 0

    behavior.apply {
      isFitToContents = false
      maxWidth = DEFAULT_MAX_WIDTH.dpToPx().toInt()

      val maxAvailableHeight = realScreenHeight - edgeToEdgeTopInset

      setPeekHeight(detentCalculator.getDetentHeight(detents[0]), isPresented)

      val halfExpandedDetentHeight = when (detents.size) {
        1 -> peekHeight
        else -> detentCalculator.getDetentHeight(detents[1])
      }

      val maxDetentHeight = detentCalculator.getDetentHeight(detents.last())

      val adjustedHalfExpandedHeight = minOf(halfExpandedDetentHeight, maxAvailableHeight)
      halfExpandedRatio = (adjustedHalfExpandedHeight.toFloat() / realScreenHeight.toFloat())
        .coerceIn(0f, 0.999f)

      expandedOffset = maxOf(edgeToEdgeTopInset, realScreenHeight - maxDetentHeight)

      // fitToContents works better with <= 2 detents when no expanded offset
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

      interactionState = InteractionState.Idle
    }
  }

  fun setupSheetDetentsForSizeChange() {
    setupSheetDetents()
    positionFooter()
  }

  fun setStateForDetentIndex(index: Int) {
    behavior?.state = detentCalculator.getStateForDetentIndex(index)
  }

  // =============================================================================
  // MARK: - Grabber
  // =============================================================================

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

  // =============================================================================
  // MARK: - Background & Dimming
  // =============================================================================

  fun setupBackground() {
    val bottomSheet = bottomSheetView ?: return

    // Rounded corners only on top
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

        // Attach dim view to parent sheet if stacked
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
        // Pass through touches to parent or activity when not dimmed
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

  fun updateDimAmount(sheetTop: Int? = null, animated: Boolean = false) {
    if (!dimmed) return
    val top = (sheetTop ?: bottomSheetView?.top ?: return) + currentKeyboardInset

    if (animated) {
      val targetAlpha = dimView?.calculateAlpha(
        top,
        dimmedDetentIndex,
        detentCalculator::getSheetTopForDetentIndex
      ) ?: 0f
      dimView?.animate()?.alpha(targetAlpha)?.setDuration(200)?.start()
      parentDimView?.animate()?.alpha(targetAlpha)?.setDuration(200)?.start()
    } else {
      dimView?.interpolateAlpha(top, dimmedDetentIndex, detentCalculator::getSheetTopForDetentIndex)
      parentDimView?.interpolateAlpha(top, dimmedDetentIndex, detentCalculator::getSheetTopForDetentIndex)
    }
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

  // =============================================================================
  // MARK: - Footer Positioning
  // =============================================================================

  fun positionFooter(slideOffset: Float? = null) {
    val footerView = containerView?.footerView ?: return
    val bottomSheet = bottomSheetView ?: return

    val footerHeight = footerView.height
    val sheetHeight = bottomSheet.height
    val sheetTop = bottomSheet.top

    var footerY = (sheetHeight - sheetTop - footerHeight - currentKeyboardInset).toFloat()

    // Adjust during dismiss animation when slideOffset is negative
    if (slideOffset != null && slideOffset < 0) {
      footerY -= (footerHeight * slideOffset)
    }

    // Clamp to prevent footer going above safe area
    val maxAllowedY = (sheetHeight - topInset - footerHeight).toFloat()
    footerView.y = minOf(footerY, maxAllowedY)
  }

  // =============================================================================
  // MARK: - Keyboard Handling
  // =============================================================================

  private fun shouldHandleKeyboard(): Boolean {
    if (wasHiddenByModal) return false
    return isTopmostSheet
  }

  fun setupKeyboardObserver() {
    val bottomSheet = bottomSheetView ?: return
    keyboardObserver = TrueSheetKeyboardObserver(bottomSheet, reactContext).apply {
      delegate = object : TrueSheetKeyboardObserverDelegate {
        override fun keyboardWillShow(height: Int) {
          if (!shouldHandleKeyboard()) return
          detentIndexBeforeKeyboard = currentDetentIndex
          isKeyboardTransitioning = true
          setupSheetDetents()
          setStateForDetentIndex(detents.size - 1)
        }

        override fun keyboardWillHide() {
          if (!shouldHandleKeyboard()) return
          setupSheetDetents()
          if (detentIndexBeforeKeyboard >= 0) {
            setStateForDetentIndex(detentIndexBeforeKeyboard)
            detentIndexBeforeKeyboard = -1
          }
        }

        override fun keyboardDidHide() {
          if (!shouldHandleKeyboard()) return
          isKeyboardTransitioning = false
        }

        override fun keyboardDidChangeHeight(height: Int) {}
      }
      start()
    }
  }

  fun cleanupKeyboardObserver() {
    keyboardObserver?.stop()
    keyboardObserver = null
  }

  // =============================================================================
  // MARK: - Drag Handling
  // =============================================================================

  private fun handleDragBegin(sheetView: View) {
    val position = detentCalculator.getPositionDp(detentCalculator.getVisibleSheetHeight(sheetView.top))
    val detent = detentCalculator.getDetentValueForIndex(currentDetentIndex)
    delegate?.viewControllerDidDragBegin(currentDetentIndex, position, detent)
    interactionState = InteractionState.Dragging(startTop = sheetView.top)
  }

  private fun handleDragChange(sheetView: View) {
    if (interactionState !is InteractionState.Dragging) return
    val position = detentCalculator.getPositionDp(detentCalculator.getVisibleSheetHeight(sheetView.top))
    val detent = detentCalculator.getDetentValueForIndex(currentDetentIndex)
    delegate?.viewControllerDidDragChange(currentDetentIndex, position, detent)
  }

  // =============================================================================
  // MARK: - Event Emission
  // =============================================================================

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

  private fun emitChangePositionDelegate(currentTop: Int, realtime: Boolean = true) {
    // Dedupe emissions for same position
    if (currentTop == lastEmittedPositionPx) return

    lastEmittedPositionPx = currentTop
    val visibleHeight = realScreenHeight - currentTop
    val position = detentCalculator.getPositionDp(visibleHeight)
    val interpolatedIndex = detentCalculator.getInterpolatedIndexForPosition(currentTop)
    val detent = detentCalculator.getInterpolatedDetentForPosition(currentTop)
    delegate?.viewControllerDidChangePosition(interpolatedIndex, position, detent, realtime)
  }

  // =============================================================================
  // MARK: - Detent Helpers
  // =============================================================================

  fun getExpectedSheetTop(detentIndex: Int): Int {
    if (detentIndex < 0 || detentIndex >= detents.size) return screenHeight
    return realScreenHeight - detentCalculator.getDetentHeight(detents[detentIndex])
  }

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

  private fun getDetentInfoWithValue(index: Int): Triple<Int, Float, Float> {
    val state = detentCalculator.getStateForDetentIndex(index)
    val detentIndex = detentCalculator.getDetentIndexForState(state) ?: 0
    val position = getPositionForDetentIndex(detentIndex)
    val detent = detentCalculator.getDetentValueForIndex(detentIndex)
    return Triple(detentIndex, position, detent)
  }

  private fun getPositionForDetentIndex(index: Int): Float {
    if (index < 0 || index >= detents.size) return screenHeight.pxToDp()

    bottomSheetView?.let {
      val visibleSheetHeight = detentCalculator.getVisibleSheetHeight(it.top)
      if (visibleSheetHeight in 1..<realScreenHeight) {
        return detentCalculator.getPositionDp(visibleSheetHeight)
      }
    }

    val detentHeight = detentCalculator.getDetentHeight(detents[index])
    return detentCalculator.getPositionDp(detentHeight)
  }

  // =============================================================================
  // MARK: - RootView Implementation
  // =============================================================================

  override fun onInitializeAccessibilityNodeInfo(info: AccessibilityNodeInfo) {
    super.onInitializeAccessibilityNodeInfo(info)
    (getTag(R.id.react_test_id) as? String)?.let { info.viewIdResourceName = it }
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)

    if (w == oldw && h == oldh) return
    if (!isPresented) return

    // Skip reconfiguration if expanded and only height changed (e.g., keyboard)
    if (h + topInset >= screenHeight && isExpanded && oldw == w) return

    post {
      setupSheetDetents()
      positionFooter()
      bottomSheetView?.let { emitChangePositionDelegate(it.top, realtime = false) }
    }
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  // =============================================================================
  // MARK: - Touch Event Handling
  // =============================================================================

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    // Footer needs special handling since it's positioned absolutely
    val footer = containerView?.footerView
    if (footer != null && footer.isVisible) {
      val footerLocation = ScreenUtils.getScreenLocation(footer)
      val touchScreenX = event.rawX.toInt()
      val touchScreenY = event.rawY.toInt()

      // Check if touch is within footer bounds
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
