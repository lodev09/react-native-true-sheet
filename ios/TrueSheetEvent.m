//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetEvent.h"
#import <React/RCTEventDispatcher.h>

@interface TrueSheetEvent ()

@property (nonatomic, copy) NSString *name;
@property (nonatomic, strong, nullable) NSDictionary *data;

@end

@implementation TrueSheetEvent

@synthesize viewTag = _viewTag;
@synthesize coalescingKey = _coalescingKey;

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                           name:(NSString *)name
                           data:(NSDictionary *)data {
    if (self = [super init]) {
        _viewTag = viewTag;
        _name = name;
        _data = data;
        _coalescingKey = 0;
    }
    return self;
}

- (NSString *)eventName {
    return self.name;
}

+ (NSString *)moduleDotMethod {
    return @"RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments {
    return @[
        self.viewTag,
        RCTNormalizeInputEventName(self.eventName),
        self.data ?: @{}
    ];
}

- (BOOL)canCoalesce {
    return YES;
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent {
    return newEvent;
}

@end