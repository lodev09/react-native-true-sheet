#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

spinner_pid=""

cleanup() {
  if [ -n "$spinner_pid" ]; then
    kill $spinner_pid 2>/dev/null
    wait $spinner_pid 2>/dev/null
  fi
  printf "\n"
  exit 1
}
trap cleanup INT TERM

step() {
  local msg="$1"
  local success_msg="$2"
  shift 2
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  local error_file=$(mktemp)

  # Start spinner in background
  (
    while true; do
      for frame in "${frames[@]}"; do
        printf "\r${CYAN}%s${NC} %s" "$frame" "$msg"
        sleep 0.08
      done
    done
  ) &
  spinner_pid=$!

  # Run the command, capture output for errors
  "$@" >"$error_file" 2>&1
  local exit_code=$?

  # Stop spinner
  kill $spinner_pid 2>/dev/null
  wait $spinner_pid 2>/dev/null

  # Show result
  if [ $exit_code -eq 0 ]; then
    printf "\r${GREEN}✓${NC} ${BOLD}%s${NC}\n" "$msg"
    echo -e "${GREEN}→${NC} $success_msg\n"
  else
    printf "\r${RED}✗${NC} ${BOLD}%s${NC}\n" "$msg"
    if [ -s "$error_file" ]; then
      echo -e "${RED}→${NC} $(cat "$error_file")\n"
    fi
    rm -f "$error_file"
    exit 1
  fi

  rm -f "$error_file"
}

install() {
  rm -rf node_modules example/bare/node_modules example/expo/node_modules docs/node_modules
  yarn
}

clean_watchman() {
  watchman watch-del-all 2>/dev/null || true
  rm -rf $TMPDIR/metro-*
}

clean_bare() {
  del-cli android/build example/bare/android/build example/bare/android/app/build example/bare/ios/build 2>/dev/null || true
  cd example/bare/android
  ./gradlew clean -q
  cd ../../..
  npx pod-install example/bare
}

step "Installing dependencies" "Dependencies installed" install
step "Cleaning watchman" "Watchman cache cleared" clean_watchman
step "Cleaning up simulator cache" "Simulator cache cleared" rm -rf ~/Library/Developer/CoreSimulator/Caches
step "Cleaning bare example" "Bare example cleaned" clean_bare
step "Prebuilding expo example" "Expo prebuild complete" yarn expo prebuild --no-install
step "Building with bob" "Build complete" bob build

echo -e "${GREEN}${BOLD}All done!${NC}"
