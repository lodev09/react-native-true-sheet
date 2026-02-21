//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#import "TrueSheetDetentCalculator.h"

@implementation TrueSheetDetentCalculator {
  NSMutableArray<NSNumber *> *_resolvedDetentOffsets;
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

- (void)learnOffsetForDetentIndex:(NSInteger)index {
  if (index < 0 || !_resolvedDetentHeights || index >= (NSInteger)_resolvedDetentHeights.count) {
    return;
  }

  CGFloat actualHeight = self.delegate.screenHeight - self.delegate.currentPosition;
  CGFloat resolverHeight = [_resolvedDetentHeights[index] doubleValue];
  // Always update — system offset can change between detent transitions
  if (resolverHeight > 0 && actualHeight > 0) {
    _resolvedDetentOffsets[index] = @(actualHeight - resolverHeight);
  }
}

- (CGFloat)resolvedHeightForIndex:(NSInteger)index {
  if (_resolvedDetentHeights && index >= 0 && index < (NSInteger)_resolvedDetentHeights.count) {
    CGFloat h = [_resolvedDetentHeights[index] doubleValue];
    if (h > 0) {
      // Use per-detent offset if learned, otherwise find any known offset
      CGFloat offset = [self offsetForIndex:index];
      return h + offset;
    }
  }

  CGFloat detentValue = [self detentValueForIndex:index];
  if (_maxDetentHeight > 0) {
    return detentValue * _maxDetentHeight;
  }
  return detentValue * self.delegate.screenHeight;
}

- (CGFloat)offsetForIndex:(NSInteger)index {
  // Use this detent's own offset if available
  if (index >= 0 && index < (NSInteger)_resolvedDetentOffsets.count) {
    CGFloat offset = [_resolvedDetentOffsets[index] doubleValue];
    if (offset != 0) return offset;
  }

  // Fall back to any known offset
  for (NSInteger i = 0; i < (NSInteger)_resolvedDetentOffsets.count; i++) {
    CGFloat offset = [_resolvedDetentOffsets[i] doubleValue];
    if (offset != 0) return offset;
  }

  return 0;
}

- (BOOL)findSegmentForPosition:(CGFloat)position outIndex:(NSInteger *)outIndex outProgress:(CGFloat *)outProgress {
  NSArray<NSNumber *> *detents = self.delegate.detents;
  NSInteger count = detents.count;
  if (count == 0) {
    *outIndex = -1;
    *outProgress = 0;
    return NO;
  }

  CGFloat screenHeight = self.delegate.screenHeight;
  CGFloat sheetHeight = screenHeight - position;
  CGFloat firstHeight = [self resolvedHeightForIndex:0];

  // Below first detent - interpolating toward closed
  if (sheetHeight < firstHeight) {
    *outIndex = -1;
    *outProgress = firstHeight > 0 ? (firstHeight - sheetHeight) / firstHeight : 0;
    return NO;
  }

  // Single detent
  if (count == 1) {
    *outIndex = 0;
    *outProgress = 0;
    return NO;
  }

  CGFloat lastHeight = [self resolvedHeightForIndex:count - 1];

  // Above last detent
  if (sheetHeight > lastHeight) {
    *outIndex = count - 1;
    *outProgress = 0;
    return NO;
  }

  // Between detents
  for (NSInteger i = 0; i < count - 1; i++) {
    CGFloat h = [self resolvedHeightForIndex:i];
    CGFloat nextH = [self resolvedHeightForIndex:i + 1];

    if (sheetHeight >= h && sheetHeight <= nextH) {
      CGFloat range = nextH - h;
      *outIndex = i;
      *outProgress = range > 0 ? (sheetHeight - h) / range : 0;
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

- (void)clearResolvedHeights {
  [_resolvedDetentHeights removeAllObjects];
  [_resolvedDetentOffsets removeAllObjects];
}

- (void)setDetentCount:(NSInteger)count {
  _resolvedDetentHeights = [NSMutableArray arrayWithCapacity:count];
  _resolvedDetentOffsets = [NSMutableArray arrayWithCapacity:count];
  for (NSInteger i = 0; i < count; i++) {
    [_resolvedDetentHeights addObject:@(0)];
    [_resolvedDetentOffsets addObject:@(0)];
  }
}

@end
