//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetDetentCalculator.h"

@implementation TrueSheetDetentCalculator {
  NSMutableArray<NSNumber *> *_resolvedDetentPositions;
}

- (instancetype)init {
  if (self = [super init]) {
    _resolvedDetentPositions = [NSMutableArray array];
  }
  return self;
}

#pragma mark - Public Methods

- (CGFloat)detentValueForIndex:(NSInteger)index {
  NSArray<NSNumber *> *detents = self.delegate.detents;
  if (index >= 0 && index < (NSInteger)detents.count) {
    CGFloat value = [detents[index] doubleValue];
    if (value == -1) {
      CGFloat autoHeight = [self.delegate.contentHeight floatValue] + [self.delegate.headerHeight floatValue];
      return autoHeight / self.delegate.screenHeight;
    }
    return value;
  }
  return 0;
}

- (CGFloat)estimatedPositionForIndex:(NSInteger)index {
  if (index < 0 || index >= (NSInteger)_resolvedDetentPositions.count) {
    return 0;
  }

  CGFloat storedPos = [_resolvedDetentPositions[index] doubleValue];
  if (storedPos > 0) {
    return storedPos;
  }

  CGFloat screenHeight = self.delegate.screenHeight;
  CGFloat detentValue = [self detentValueForIndex:index];
  CGFloat basePosition = screenHeight - (detentValue * screenHeight);

  // Try to find offset from a known resolved position
  for (NSInteger i = 0; i < (NSInteger)_resolvedDetentPositions.count; i++) {
    CGFloat pos = [_resolvedDetentPositions[i] doubleValue];
    if (pos > 0) {
      CGFloat knownDetent = [self detentValueForIndex:i];
      CGFloat expectedPos = screenHeight - (knownDetent * screenHeight);
      CGFloat offset = pos - expectedPos;
      return basePosition + offset;
    }
  }

  return basePosition;
}

- (void)storeResolvedPositionForIndex:(NSInteger)index {
  if (index >= 0 && index < (NSInteger)_resolvedDetentPositions.count) {
    _resolvedDetentPositions[index] = @(self.delegate.currentPosition);
  }
}

- (BOOL)findSegmentForPosition:(CGFloat)position outIndex:(NSInteger *)outIndex outProgress:(CGFloat *)outProgress {
  NSInteger count = _resolvedDetentPositions.count;
  if (count == 0) {
    *outIndex = -1;
    *outProgress = 0;
    return NO;
  }

  CGFloat screenHeight = self.delegate.screenHeight;
  CGFloat firstPos = [self estimatedPositionForIndex:0];

  // Above first detent - interpolating toward closed
  if (position > firstPos) {
    CGFloat range = screenHeight - firstPos;
    *outIndex = -1;
    *outProgress = range > 0 ? (position - firstPos) / range : 0;
    return NO;
  }

  // Single detent - at or above the detent
  if (count == 1) {
    *outIndex = 0;
    *outProgress = 0;
    return NO;
  }

  CGFloat lastPos = [self estimatedPositionForIndex:count - 1];

  // Below last detent
  if (position < lastPos) {
    *outIndex = count - 1;
    *outProgress = 0;
    return NO;
  }

  // Between detents
  for (NSInteger i = 0; i < count - 1; i++) {
    CGFloat pos = [self estimatedPositionForIndex:i];
    CGFloat nextPos = [self estimatedPositionForIndex:i + 1];

    if (position <= pos && position >= nextPos) {
      CGFloat range = pos - nextPos;
      *outIndex = i;
      *outProgress = range > 0 ? (pos - position) / range : 0;
      return YES;
    }
  }

  *outIndex = count - 1;
  *outProgress = 0;
  return NO;
}

- (CGFloat)interpolatedIndexForPosition:(CGFloat)position {
  NSInteger index;
  CGFloat progress;
  BOOL found = [self findSegmentForPosition:position outIndex:&index outProgress:&progress];

  if (!found) {
    if (index == -1) {
      return -progress;
    }
    return index;
  }

  return index + fmax(0, fmin(1, progress));
}

- (CGFloat)interpolatedDetentForPosition:(CGFloat)position {
  NSInteger index;
  CGFloat progress;
  BOOL found = [self findSegmentForPosition:position outIndex:&index outProgress:&progress];

  if (!found) {
    if (index == -1) {
      CGFloat firstDetent = [self detentValueForIndex:0];
      return fmax(0, firstDetent * (1 - progress));
    }
    return [self detentValueForIndex:index];
  }

  CGFloat detent = [self detentValueForIndex:index];
  CGFloat nextDetent = [self detentValueForIndex:index + 1];
  return detent + progress * (nextDetent - detent);
}

- (void)clearResolvedPositions {
  [_resolvedDetentPositions removeAllObjects];
}

- (void)setDetentCount:(NSInteger)count {
  [_resolvedDetentPositions removeAllObjects];
  for (NSInteger i = 0; i < count; i++) {
    [_resolvedDetentPositions addObject:@(0)];
  }
}

@end
