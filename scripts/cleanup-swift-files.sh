#!/bin/bash

# Cleanup script to remove Swift files after Objective-C conversion
# Run this from the project root directory

echo "🧹 Cleaning up Swift files after Objective-C conversion..."

# Array of files to remove
FILES_TO_REMOVE=(
  "ios/TrueSheetViewManager.swift"
  "ios/TrueSheetView.swift"
  "ios/TrueSheetViewController.swift"
  "ios/TrueSheetEvent.swift"
  "ios/Extensions/UIBlurEffect+withTint.swift"
  "ios/Extensions/UIView+pinTo.swift"
  "ios/Extensions/UIViewController+detentForSize.swift"
  "ios/Utils/Logger.swift"
  "ios/Utils/Promise.swift"
  "ios/TrueSheet-Bridging-Header.h"
  "ios/.swift-version"
  "ios/.swiftformat"
  "ios/.swiftlint.yml"
)

# Remove files
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    echo "  ❌ Removing $file"
    rm "$file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

# Remove empty directories
DIRS_TO_CHECK=(
  "ios/Extensions"
  "ios/Utils"
)

for dir in "${DIRS_TO_CHECK[@]}"; do
  if [ -d "$dir" ]; then
    if [ -z "$(ls -A $dir)" ]; then
      echo "  🗑️  Removing empty directory: $dir"
      rmdir "$dir"
    else
      echo "  ℹ️  Directory not empty: $dir"
    fi
  fi
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "  1. Clean Xcode build folder (⌘⇧K)"
echo "  2. Remove derived data: rm -rf ~/Library/Developer/Xcode/DerivedData"
echo "  3. cd example/ios && pod install"
echo "  4. Build and test the example app"