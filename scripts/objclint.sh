#!/bin/bash
# Format Objective-C code using clang-format
# For static analysis, consider using OCLint: brew install oclint

if which clang-format >/dev/null; then
  find ios -name "*.h" -o -name "*.mm" | while read file; do
    clang-format -i "$file"
  done
else
  echo "error: clang-format not installed, install with 'brew install clang-format'"
  exit 1
fi
