#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

step() {
  echo -e "\n${BLUE}▶${NC} ${BOLD}$1${NC}"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

step "Installing dependencies"
yarn && success "Dependencies installed"

step "Cleaning Android"
cd example/bare/android
./gradlew clean && success "Android cleaned"
cd ../../..

step "Cleaning Watchman"
watchman watch-del ./ ; watchman watch-project ./
rm -rf $TMPDIR/metro-*
success "Watchman cache cleared"

step "Cleaning up Simulator cache"
# fixes "Unable to boot Simulator" error
rm -rf ~/Library/Developer/CoreSimulator/Caches
success "Simulator cache cleared"

step "Removing temp directories"
del-cli android/build example/bare/android/build example/bare/android/app/build example/bare/ios/build
success "Temp directories removed"

step "Installing pods"
npx pod-install example/bare && success "Pods installed"

step "Prebuilding Expo"
yarn expo prebuild:clean && success "Expo prebuild complete"

step "Building with bob"
bob build && success "Build complete"

echo -e "\n${GREEN}${BOLD}All done!${NC}"
