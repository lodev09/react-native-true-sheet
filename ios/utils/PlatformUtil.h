//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#ifndef PlatformUtil_h
#define PlatformUtil_h

#define RNTS_IPHONE_OS_VERSION_AVAILABLE(v) \
  (defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_##v) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_##v)

#endif /* PlatformUtil_h */
