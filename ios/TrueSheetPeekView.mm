//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifdef RCT_NEW_ARCH_ENABLED

#import "TrueSheetPeekView.h"
#import <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>
#import <react/renderer/components/TrueSheetSpec/EventEmitters.h>
#import <react/renderer/components/TrueSheetSpec/Props.h>
#import <react/renderer/components/TrueSheetSpec/RCTComponentViewHelpers.h>
#import "TrueSheetContainerView.h"

using namespace facebook::react;

@implementation TrueSheetPeekView {
  CGRect _lastFrame;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<TrueSheetPeekViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TrueSheetPeekViewProps>();
    _props = defaultProps;

    _lastFrame = CGRectZero;
  }
  return self;
}

/**
 * Peek can be nested anywhere within the content, so it attaches itself to the
 * nearest container instead of being mounted by it. The container also searches
 * for it when the content mounts to cover the initial (bottom-up) mount order.
 */
- (void)attachToContainerView {
  if (self.delegate) {
    return;
  }

  UIView *view = self.superview;
  while (view && ![view isKindOfClass:[TrueSheetContainerView class]]) {
    view = view.superview;
  }

  if (view) {
    [(TrueSheetContainerView *)view attachPeekView:self];
  }
}

- (void)didMoveToSuperview {
  [super didMoveToSuperview];
  if (self.superview) {
    [self attachToContainerView];
  }
}

- (void)didMoveToWindow {
  [super didMoveToWindow];
  if (self.window) {
    [self attachToContainerView];
  }
}

- (void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  // Compare the whole frame — the peek's offset within the content affects
  // the peek detent, so position changes matter too.
  CGRect newFrame = CGRectMake(
    layoutMetrics.frame.origin.x,
    layoutMetrics.frame.origin.y,
    layoutMetrics.frame.size.width,
    layoutMetrics.frame.size.height);

  if (!CGRectEqualToRect(newFrame, _lastFrame)) {
    _lastFrame = newFrame;
    [self.delegate peekViewDidChangeSize:newFrame.size];
  }
}

- (void)prepareForRecycle {
  [super prepareForRecycle];
  _lastFrame = CGRectZero;
  [self.delegate peekViewWillDetach:self];
}

@end

Class<RCTComponentViewProtocol> TrueSheetPeekViewCls(void) {
  return TrueSheetPeekView.class;
}

#endif
