package com.lodev09.truesheet

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.react.uimanager.UIManagerHelper
import com.lodev09.truesheet.core.TrueSheetStackManager
import java.util.concurrent.ConcurrentHashMap

/**
 * TurboModule for TrueSheet imperative API
 * Provides promise-based async operations using view references
 */
@ReactModule(name = TrueSheetModule.NAME)
class TrueSheetModule(reactContext: ReactApplicationContext) :
  com.facebook.react.bridge.ReactContextBaseJavaModule(reactContext),
  TurboModule {

  override fun getName(): String = NAME

  override fun invalidate() {
    super.invalidate()
    // Clear all registered views and observer on module invalidation
    synchronized(viewRegistry) {
      viewRegistry.clear()
    }
    TrueSheetStackManager.clear()
  }

  /**
   * Present a sheet by reference
   *
   * @param viewTag Native view tag of the sheet component
   * @param index Detent index to present at
   * @param promise Promise that resolves when sheet is fully presented
   * @throws VIEW_NOT_FOUND if the view with the given tag is not found
   * @throws INVALID_VIEW_TYPE if the view is not a TrueSheetView
   * @throws OPERATION_FAILED if the operation fails for any other reason
   */
  @ReactMethod
  fun presentByRef(viewTag: Double, index: Double, animated: Boolean, promise: Promise) {
    val tag = viewTag.toInt()
    val detentIndex = index.toInt()

    withTrueSheetView(tag, promise) { view ->
      view.present(detentIndex, animated) {
        promise.resolve(null)
      }
    }
  }

  /**
   * Dismiss a sheet and all sheets presented on top of it
   *
   * @param viewTag Native view tag of the sheet component
   * @param promise Promise that resolves when sheet is fully dismissed
   * @throws VIEW_NOT_FOUND if the view with the given tag is not found
   * @throws INVALID_VIEW_TYPE if the view is not a TrueSheetView
   * @throws OPERATION_FAILED if the operation fails for any other reason
   */
  @ReactMethod
  fun dismissByRef(viewTag: Double, animated: Boolean, promise: Promise) {
    val tag = viewTag.toInt()

    withTrueSheetView(tag, promise) { view ->
      view.dismissAll(animated) {
        promise.resolve(null)
      }
    }
  }

  /**
   * Dismiss only the sheets presented on top of this sheet, keeping this sheet presented
   *
   * @param viewTag Native view tag of the sheet component
   * @param promise Promise that resolves when all child sheets are fully dismissed
   * @throws VIEW_NOT_FOUND if the view with the given tag is not found
   * @throws INVALID_VIEW_TYPE if the view is not a TrueSheetView
   * @throws OPERATION_FAILED if the operation fails for any other reason
   */
  @ReactMethod
  fun dismissChildrenByRef(viewTag: Double, animated: Boolean, promise: Promise) {
    val tag = viewTag.toInt()

    withTrueSheetView(tag, promise) { view ->
      view.dismissChildren(animated) {
        promise.resolve(null)
      }
    }
  }

  /**
   * Resize a sheet to a different index by reference
   *
   * @param viewTag Native view tag of the sheet component
   * @param index New detent index
   * @param promise Promise that resolves when resize is complete
   * @throws VIEW_NOT_FOUND if the view with the given tag is not found
   * @throws INVALID_VIEW_TYPE if the view is not a TrueSheetView
   * @throws OPERATION_FAILED if the operation fails for any other reason
   */
  @ReactMethod
  fun resizeByRef(viewTag: Double, index: Double, promise: Promise) {
    val tag = viewTag.toInt()
    val detentIndex = index.toInt()

    withTrueSheetView(tag, promise) { view ->
      view.resize(detentIndex) {
        promise.resolve(null)
      }
    }
  }

  /**
   * Dismiss all presented sheets by dismissing from the bottom of the stack
   *
   * @param animated Whether to animate the dismissals
   * @param promise Promise that resolves when all sheets are dismissed
   */
  @ReactMethod
  fun dismissAll(animated: Boolean, promise: Promise) {
    Handler(Looper.getMainLooper()).post {
      try {
        val rootSheet = TrueSheetStackManager.getRootSheet()
        if (rootSheet == null) {
          promise.resolve(null)
          return@post
        }

        rootSheet.dismissAll(animated) {
          promise.resolve(null)
        }
      } catch (e: Exception) {
        promise.reject("OPERATION_FAILED", "Failed to dismiss all sheets: ${e.message}", e)
      }
    }
  }

  /**
   * Helper method to get TrueSheetView by tag and execute closure
   */
  private fun withTrueSheetView(tag: Int, promise: Promise, closure: (view: TrueSheetView) -> Unit) {
    Handler(Looper.getMainLooper()).post {
      try {
        // First try to get from registry (faster)
        var view = getSheetByTag(tag)

        // Fallback to UIManager resolution
        if (view == null) {
          val manager = UIManagerHelper.getUIManagerForReactTag(reactApplicationContext, tag)
          val resolvedView = manager?.resolveView(tag)

          if (resolvedView is TrueSheetView) {
            view = resolvedView
          } else if (resolvedView != null) {
            promise.reject(
              "INVALID_VIEW_TYPE",
              "View with tag $tag is not a TrueSheetView (got ${resolvedView::class.simpleName})"
            )
            return@post
          }
        }

        if (view == null) {
          promise.reject("VIEW_NOT_FOUND", "TrueSheetView with tag $tag not found")
          return@post
        }

        closure(view)
      } catch (e: Exception) {
        promise.reject("OPERATION_FAILED", "Failed to execute operation: ${e.message}", e)
      }
    }
  }

  companion object {
    const val NAME = "TrueSheetModule"

    /**
     * Registry to keep track of TrueSheetView instances by their view tag
     * This provides fast lookup for ref-based operations
     */
    private val viewRegistry = ConcurrentHashMap<Int, TrueSheetView>()

    /**
     * Register a TrueSheetView instance
     * Called automatically by TrueSheetView during initialization
     */
    @JvmStatic
    fun registerView(view: TrueSheetView, tag: Int) {
      viewRegistry[tag] = view
    }

    /**
     * Unregister a TrueSheetView instance
     * Called automatically by TrueSheetView during cleanup
     */
    @JvmStatic
    fun unregisterView(tag: Int) {
      viewRegistry.remove(tag)
    }

    /**
     * Get a TrueSheetView by its tag
     * @param tag - The React native tag of the view
     * @return The TrueSheetView instance, or null if not found
     */
    @JvmStatic
    fun getSheetByTag(tag: Int): TrueSheetView? = viewRegistry[tag]
  }
}
