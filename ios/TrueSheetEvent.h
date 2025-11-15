//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import <Foundation/Foundation.h>
#import <React/RCTEventDispatcher.h>

NS_ASSUME_NONNULL_BEGIN

@interface TrueSheetEvent : NSObject <RCTEvent>

@property (nonatomic, strong) NSNumber *viewTag;

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                           name:(NSString *)name
                           data:(NSDictionary * _Nullable)data;

@end

NS_ASSUME_NONNULL_END