package com.lodev09.truesheet

import android.annotation.SuppressLint
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

/**
 * Footer view that holds the footer content
 * This is the second child of TrueSheetContainerView
 * Positioned absolutely at the bottom of the sheet
 */
@SuppressLint("ViewConstructor")
class TrueSheetFooterView(context: ThemedReactContext) : ReactViewGroup(context)
