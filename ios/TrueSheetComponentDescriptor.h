//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

#pragma once

#ifdef RCT_NEW_ARCH_ENABLED

#include <react/renderer/components/TrueSheetSpec/ComponentDescriptors.h>

namespace facebook::react {

class TrueSheetComponentDescriptor final : public ConcreteComponentDescriptor<TrueSheetViewComponentDescriptor> {
public:
    using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace facebook::react

#endif // RCT_NEW_ARCH_ENABLED