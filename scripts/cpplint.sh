#!/bin/bash

if command -v clang-format >/dev/null; then
  find common/cpp -type f \( -name "*.h" -o -name "*.cpp" \) -exec clang-format -i {} +
else
  echo "error: clang-format not installed, install with 'brew install clang-format'"
  exit 1
fi
