package com.lodev09.truesheet

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.TypedValue
import android.view.Gravity
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.widget.SearchView
import androidx.appcompat.widget.Toolbar
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.view.ReactViewGroup
import com.google.android.material.appbar.MaterialToolbar
import com.lodev09.truesheet.events.*

/**
 * Delegate interface for nav bar height changes
 */
interface TrueSheetNavBarViewDelegate {
  fun navBarViewDidChangeHeight(width: Int, height: Int)
}

/**
 * Invisible config view for the sheet's native navigation bar.
 * Owns a MaterialToolbar that is attached natively to the sheet's controller,
 * pinned above the RN-managed container. Bar item children are re-parented
 * into the toolbar — child accessors are proxied so React still sees them.
 */
@SuppressLint("ViewConstructor")
class TrueSheetNavBarView(private val reactContext: ThemedReactContext) : ReactViewGroup(reactContext) {

  var delegate: TrueSheetNavBarViewDelegate? = null
  var eventDispatcher: EventDispatcher? = null

  // ==================== Props ====================

  var title: String? = null
  var largeTitle: Boolean = false
  var tintColor: Int? = null
  var titleColor: Int? = null
  var barColor: Int? = null
  var separatorHidden: Boolean = false
  var searchable: Boolean = false
  var searchPlaceholder: String? = null

  // ==================== Toolbar ====================

  private val toolbarView: ToolbarView = ToolbarView(reactContext)

  val toolbar: MaterialToolbar
    get() = toolbarView

  private var lastBarHeight = 0
  private var isRelayoutPending = false

  // Mirrors React's child indices — the actual native parent is the toolbar
  private val itemViews = mutableListOf<View>()

  private var searchMenuItem: MenuItem? = null
  private var searchView: SearchView? = null

  init {
    toolbar.minimumHeight = resolveActionBarSize()
    toolbar.setBackgroundColor(Color.TRANSPARENT)
  }

  // ==================== React Child Management ====================

  override fun addView(child: View?, index: Int) {
    child ?: return

    itemViews.add(index, child)
    toolbar.addView(child, createItemLayoutParams(child))

    if (child is TrueSheetNavBarItemView) {
      child.navBar = this
    }
    updateTitle()
  }

  override fun getChildCount(): Int = itemViews.size

  override fun getChildAt(index: Int): View? = itemViews.getOrNull(index)

  override fun removeViewAt(index: Int) {
    val child = itemViews.removeAt(index)
    toolbar.removeView(child)

    if (child is TrueSheetNavBarItemView) {
      child.navBar = null
    }
    updateTitle()
  }

  // ==================== Layout ====================

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    // The config view spans the container's width (height stays 0)
    layoutToolbar()
  }

  /**
   * Manually measures and lays out the toolbar — its parent is a React-managed
   * view group that never runs a native layout pass on it.
   */
  fun layoutToolbar() {
    val barWidth = if (width > 0) width else (toolbar.parent as? View)?.width ?: 0
    if (barWidth <= 0) return

    toolbar.measure(
      MeasureSpec.makeMeasureSpec(barWidth, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED)
    )
    val newBarHeight = toolbar.measuredHeight
    toolbar.layout(0, 0, barWidth, newBarHeight)

    if (newBarHeight != lastBarHeight) {
      lastBarHeight = newBarHeight
      delegate?.navBarViewDidChangeHeight(barWidth, newBarHeight)
    }
  }

  private fun requestBarLayout() {
    toolbar.requestLayout()
  }

  // ==================== Toolbar Attachment ====================

  /**
   * Attaches the toolbar to the sheet's controller so it stays pinned at the
   * sheet's top edge, above (and outside) the RN-managed container.
   */
  fun attachToolbar() {
    val controller = (parent as? TrueSheetContainerView)?.parent as? TrueSheetViewController ?: return
    if (toolbar.parent === controller) return

    (toolbar.parent as? ViewGroup)?.removeView(toolbar)
    controller.addView(toolbar)
    layoutToolbar()
  }

  fun detachToolbar() {
    (toolbar.parent as? ViewGroup)?.removeView(toolbar)
  }

  // ==================== Configuration ====================

  /**
   * Called by the ViewManager after all properties are set.
   */
  fun finalizeUpdates() {
    toolbar.setBackgroundColor(barColor ?: Color.TRANSPARENT)
    toolbarView.separatorVisible = !separatorHidden

    // No large title collapse behavior on Android — bump the title text appearance instead
    val titleAppearance = if (largeTitle) {
      androidx.appcompat.R.style.TextAppearance_AppCompat_Headline
    } else {
      androidx.appcompat.R.style.TextAppearance_AppCompat_Widget_ActionBar_Title
    }
    toolbar.setTitleTextAppearance(context, titleAppearance)
    toolbar.setTitleTextColor(titleColor ?: tintColor ?: defaultTitleColor())

    tintColor?.let {
      toolbar.setNavigationIconTint(it)
      toolbar.collapseIcon?.setTint(it)
    }

    updateTitle()
    setupSearch()
    requestBarLayout()
  }

  fun itemSlotDidChange(item: TrueSheetNavBarItemView) {
    (item.layoutParams as? Toolbar.LayoutParams)?.let {
      it.gravity = gravityForSlotType(item.slotType)
      item.layoutParams = it
    }
    updateTitle()
    requestBarLayout()
  }

  private fun createItemLayoutParams(child: View): Toolbar.LayoutParams {
    val slotType = (child as? TrueSheetNavBarItemView)?.slotType ?: TrueSheetNavBarItemView.SlotType.LEFT
    return Toolbar.LayoutParams(
      Toolbar.LayoutParams.WRAP_CONTENT,
      Toolbar.LayoutParams.WRAP_CONTENT,
      gravityForSlotType(slotType)
    )
  }

  private fun gravityForSlotType(slotType: TrueSheetNavBarItemView.SlotType): Int {
    val horizontalGravity = when (slotType) {
      TrueSheetNavBarItemView.SlotType.RIGHT -> Gravity.END
      TrueSheetNavBarItemView.SlotType.TITLE -> Gravity.CENTER_HORIZONTAL
      else -> Gravity.START
    }
    return horizontalGravity or Gravity.CENTER_VERTICAL
  }

  /**
   * A title item acts as the title custom view — it replaces the title text.
   */
  private fun updateTitle() {
    val hasTitleItem = itemViews.any { (it as? TrueSheetNavBarItemView)?.slotType == TrueSheetNavBarItemView.SlotType.TITLE }
    toolbar.title = if (hasTitleItem) null else title
  }

  // ==================== Search ====================

  private fun setupSearch() {
    if (!searchable) {
      if (searchMenuItem != null) {
        toolbar.menu.removeItem(SEARCH_MENU_ITEM_ID)
        searchMenuItem = null
        searchView = null
      }
      return
    }

    if (searchMenuItem == null) {
      val search = SearchView(toolbar.context).apply {
        setOnQueryTextFocusChangeListener { _, hasFocus ->
          dispatchEvent(
            if (hasFocus) {
              SearchFocusEvent(surfaceId, id)
            } else {
              SearchBlurEvent(surfaceId, id)
            }
          )
        }
        setOnQueryTextListener(object : SearchView.OnQueryTextListener {
          override fun onQueryTextChange(newText: String): Boolean {
            dispatchEvent(SearchChangeEvent(surfaceId, id, newText))
            return true
          }

          override fun onQueryTextSubmit(query: String): Boolean {
            dispatchEvent(SearchSubmitEvent(surfaceId, id, query))
            return true
          }
        })
      }
      searchView = search

      searchMenuItem = toolbar.menu.add(Menu.NONE, SEARCH_MENU_ITEM_ID, Menu.NONE, SEARCH_MENU_TITLE).apply {
        setShowAsAction(MenuItem.SHOW_AS_ACTION_ALWAYS or MenuItem.SHOW_AS_ACTION_COLLAPSE_ACTION_VIEW)
        setIcon(androidx.appcompat.R.drawable.abc_ic_search_api_material)
        actionView = search
        setOnActionExpandListener(object : MenuItem.OnActionExpandListener {
          override fun onMenuItemActionExpand(item: MenuItem): Boolean = true

          override fun onMenuItemActionCollapse(item: MenuItem): Boolean {
            search.setQuery("", false)
            dispatchEvent(SearchCancelEvent(surfaceId, id))
            return true
          }
        })
      }
    }

    searchView?.queryHint = searchPlaceholder
    tintColor?.let { searchMenuItem?.icon?.setTint(it) }
  }

  // ==================== Event Dispatching ====================

  private val surfaceId: Int
    get() = UIManagerHelper.getSurfaceId(this)

  private fun dispatchEvent(event: Event<*>) {
    eventDispatcher?.dispatchEvent(event)
  }

  // ==================== Helpers ====================

  private fun defaultTitleColor(): Int {
    val typedArray = context.obtainStyledAttributes(intArrayOf(android.R.attr.textColorPrimary))
    val color = typedArray.getColor(0, Color.BLACK)
    typedArray.recycle()
    return color
  }

  private fun resolveActionBarSize(): Int {
    val typedValue = TypedValue()
    val resolved = context.theme.resolveAttribute(androidx.appcompat.R.attr.actionBarSize, typedValue, true) ||
      context.theme.resolveAttribute(android.R.attr.actionBarSize, typedValue, true)

    return if (resolved) {
      TypedValue.complexToDimensionPixelSize(typedValue.data, resources.displayMetrics)
    } else {
      DEFAULT_BAR_HEIGHT.dpToPx().toInt()
    }
  }

  private fun isDarkMode(): Boolean =
    (
      reactContext.resources.configuration.uiMode and
        Configuration.UI_MODE_NIGHT_MASK
      ) == Configuration.UI_MODE_NIGHT_YES

  // ==================== ToolbarView ====================

  private inner class ToolbarView(context: Context) : MaterialToolbar(context) {
    var separatorVisible = false
      set(value) {
        if (field == value) return
        field = value
        invalidate()
      }

    private val separatorPaint = Paint().apply {
      color = if (isDarkMode()) SEPARATOR_COLOR_DARK else SEPARATOR_COLOR_LIGHT
    }

    override fun requestLayout() {
      super.requestLayout()

      // React-managed ancestors never run a native layout pass on the toolbar —
      // schedule a manual one
      if (isRelayoutPending) return
      isRelayoutPending = true
      post {
        isRelayoutPending = false
        layoutToolbar()
      }
    }

    override fun dispatchDraw(canvas: Canvas) {
      super.dispatchDraw(canvas)
      if (separatorVisible) {
        val separatorHeight = maxOf(1f, SEPARATOR_HEIGHT.dpToPx())
        canvas.drawRect(0f, height - separatorHeight, width.toFloat(), height.toFloat(), separatorPaint)
      }
    }
  }

  companion object {
    const val TAG_NAME = "TrueSheet"

    private const val DEFAULT_BAR_HEIGHT = 56 // dp
    private const val SEPARATOR_HEIGHT = 0.5f // dp
    private const val SEARCH_MENU_ITEM_ID = 1
    private const val SEARCH_MENU_TITLE = "Search"

    private const val SEPARATOR_COLOR_LIGHT = 0x1F000000
    private const val SEPARATOR_COLOR_DARK = 0x33FFFFFF
  }
}
