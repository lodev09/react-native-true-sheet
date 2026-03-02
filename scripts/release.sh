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

# Version docs (only on minor bumps, e.g. 3.10.0, not 3.10.1)
PATCH=$(echo "$VERSION" | sed 's/[0-9]*\.[0-9]*\.\([0-9]*\).*/\1/')

if [ "$PATCH" != "0" ]; then
  echo "Patch release, skipping docs versioning."
else
  DOCS_VERSION=$(echo "$VERSION" | sed 's/\([0-9]*\.[0-9]*\).*/\1/')
  echo "Creating docs version $DOCS_VERSION..."
  cd docs && ./node_modules/.bin/docusaurus docs:version "$DOCS_VERSION" && cd ..
  sed -i '' "s/lastVersion: '.*'/lastVersion: '$DOCS_VERSION'/" docs/docusaurus.config.ts
  echo "Docs version $DOCS_VERSION created."
fi
