//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

// tvOS stubs. Codegen registers TrueSheet components and looks them up via
// NSClassFromString on all Apple platforms, so the classes must exist on tvOS
// even though sheets are not supported there.

#import <TargetConditionals.h>

#if TARGET_OS_TV && defined(RCT_NEW_ARCH_ENABLED)

#import <React/RCTBridgeModule.h>
#import <React/RCTViewComponentView.h>

#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/TrueSheetViewComponentDescriptor.h>

#import <TrueSheetSpec/TrueSheetSpec.h>

using namespace facebook::react;

#pragma mark - Component Views

@interface TrueSheetView : RCTViewComponentView
@end

@implementation TrueSheetView

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetViewComponentDescriptor>();
}

@end

@interface TrueSheetContainerView : RCTViewComponentView
@end

@implementation TrueSheetContainerView

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContainerViewComponentDescriptor>();
}

@end

@interface TrueSheetContentView : RCTViewComponentView
@end

@implementation TrueSheetContentView

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetContentViewComponentDescriptor>();
}

@end

@interface TrueSheetHeaderView : RCTViewComponentView
@end

@implementation TrueSheetHeaderView

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetHeaderViewComponentDescriptor>();
}

@end

@interface TrueSheetFooterView : RCTViewComponentView
@end

@implementation TrueSheetFooterView

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetFooterViewComponentDescriptor>();
}

@end

#pragma mark - Module

@interface TrueSheetModule : NSObject <RCTBridgeModule, NativeTrueSheetModuleSpec>
@end

@implementation TrueSheetModule

RCT_EXPORT_MODULE(TrueSheetModule)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
  (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeTrueSheetModuleSpecJSI>(params);
}

- (void)presentByRef:(double)viewTag
               index:(double)index
            animated:(BOOL)animated
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  reject(@"PRESENT_FAILED", @"TrueSheet is not supported on tvOS", nil);
}

- (void)dismissByRef:(double)viewTag
            animated:(BOOL)animated
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
  resolve(nil);
}

- (void)dismissStackByRef:(double)viewTag
                 animated:(BOOL)animated
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject {
  resolve(nil);
}

- (void)resizeByRef:(double)viewTag
              index:(double)index
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  resolve(nil);
}

- (void)handleBackPress:(double)viewTag resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve(nil);
}

- (void)dismissAll:(BOOL)animated resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve(nil);
}

@end

#endif  // TARGET_OS_TV && RCT_NEW_ARCH_ENABLED
