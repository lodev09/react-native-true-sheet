#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(SheetifyViewManager, RCTViewManager)

RCT_EXTERN_METHOD(present: (nonnull NSNumber*)node
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)

@end
