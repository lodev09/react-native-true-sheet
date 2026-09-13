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

# Regenerate the bare example's Podfile.lock with the bumped pod version
echo "Installing pods for example/bare..."
(cd example/bare/ios && pod install)

DOCS=docs/content/docs

# Patch a docs meta.json, which drives the version dropdown label
write_meta() {
  node -e '
    const fs = require("fs");
    const [file, patch] = process.argv.slice(1);
    const meta = { ...JSON.parse(fs.readFileSync(file, "utf8")), ...JSON.parse(patch) };
    fs.writeFileSync(file, JSON.stringify(meta, null, 2) + "\n");
  ' "$1" "$2"
}

# Skip changelog and docs versioning for pre-releases (beta, alpha, rc)
if echo "$VERSION" | grep -q '-'; then
  echo "Pre-release detected, skipping changelog and docs versioning."
  write_meta "$DOCS/next/meta.json" "{\"title\": \"Next\", \"description\": \"$VERSION\"}"
  echo "Docs next label set to $VERSION."
else
  # Update CHANGELOG
  sed -i '' "s/## Unreleased/## Unreleased\\n\\n## ${VERSION}/" CHANGELOG.md

  # Version docs: snapshot the unreleased docs as the new latest version.
  # `next` keeps evolving as the unreleased docs.
  echo "Creating docs version $VERSION..."

  # On a major bump, keep the outgoing docs browsable at /v<major> instead of
  # dropping them, since the previous major stays supported on its own branch.
  OLD_VERSION=$(node -p "require('./$DOCS/latest/meta.json').title")
  if [ "${OLD_VERSION%%.*}" != "${VERSION%%.*}" ]; then
    ARCHIVE="v${OLD_VERSION%%.*}"
    rm -rf "$DOCS/$ARCHIVE"
    mv "$DOCS/latest" "$DOCS/$ARCHIVE"
    write_meta "$DOCS/$ARCHIVE/meta.json" "{\"title\": \"$OLD_VERSION\", \"description\": \"Legacy\"}"
    PAGES=$(node -p "JSON.stringify([...new Set([...require('./$DOCS/meta.json').pages, '$ARCHIVE'])])")
    write_meta "$DOCS/meta.json" "{\"pages\": $PAGES}"
    echo "Archived docs $OLD_VERSION to $ARCHIVE."
  else
    rm -rf "$DOCS/latest"
  fi

  cp -R "$DOCS/next" "$DOCS/latest"
  write_meta "$DOCS/latest/meta.json" "{\"title\": \"$VERSION\", \"description\": \"Latest\"}"
  write_meta "$DOCS/next/meta.json" "{\"title\": \"Next\", \"description\": \"Unreleased\"}"
  echo "Docs version $VERSION created."
fi
