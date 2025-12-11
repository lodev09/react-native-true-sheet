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
yarn >/dev/null && success "Dependencies installed"

step "Cleaning watchman"
watchman watch-del-all >/dev/null || true
rm -rf $TMPDIR/metro-*
success "Watchman cache cleared"

step "Cleaning up simulator cache"
rm -rf ~/Library/Developer/CoreSimulator/Caches
success "Simulator cache cleared"

step "Cleaning bare example"
del-cli android/build example/bare/android/build example/bare/android/app/build example/bare/ios/build >/dev/null || true
cd example/bare/android
./gradlew clean -q
cd ../../..
npx pod-install example/bare >/dev/null
success "Bare example cleaned"

step "Prebuilding expo example"
yarn expo prebuild:clean --no-install >/dev/null && success "Expo prebuild complete"

step "Building with bob"
bob build >/dev/null && success "Build complete"

echo -e "\n${GREEN}${BOLD}All done!${NC}"
