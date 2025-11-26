package com.lodev09.truesheet

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

/**
 * TrueSheet package for Fabric architecture
 * Registers all view managers and the TurboModule
 */
class TrueSheetPackage : TurboReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    when (name) {
      TrueSheetModule.NAME -> TrueSheetModule(reactContext)
      else -> null
    }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
    ReactModuleInfoProvider {
      mapOf(
        TrueSheetModule.NAME to ReactModuleInfo(
          TrueSheetModule.NAME,
          TrueSheetModule::class.java.name,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          true, // hasConstants
          false, // isCxxModule
          true // isTurboModule
        )
      )
    }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    listOf(
      TrueSheetViewManager(),
      TrueSheetContainerViewManager(),
      TrueSheetContentViewManager(),
      TrueSheetHeaderViewManager(),
      TrueSheetFooterViewManager()
    )
}
