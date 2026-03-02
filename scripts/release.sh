#!/bin/bash

# Post-bump release tasks.
# Called by release-it's after:bump hook.
# Usage: scripts/release.sh <version>

set -e

VERSION="$1"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

# Tidy up
yarn tidy

# Update CHANGELOG
sed -i '' "s/## Unreleased/## Unreleased\\n\\n## ${VERSION}/" CHANGELOG.md

# Version docs (replaces previous snapshot with latest)
echo "Creating docs version $VERSION..."

rm -rf docs/versioned_docs docs/versioned_sidebars docs/versions.json

# Temporarily comment out lastVersion (validated against existing versions)
sed -i '' "s/lastVersion: '.*'/\/\/ lastVersion: '$VERSION'/" docs/docusaurus.config.ts
cd docs && ./node_modules/.bin/docusaurus docs:version "$VERSION" && cd ..
sed -i '' "s/\/\/ lastVersion: '$VERSION'/lastVersion: '$VERSION'/" docs/docusaurus.config.ts

echo "Docs version $VERSION created."
