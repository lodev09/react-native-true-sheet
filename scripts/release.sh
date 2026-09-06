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

# Skip changelog and docs versioning for pre-releases (beta, alpha, rc)
if echo "$VERSION" | grep -q '-'; then
  echo "Pre-release detected, skipping changelog and docs versioning."
else
  # Update CHANGELOG
  sed -i '' "s/## Unreleased/## Unreleased\\n\\n## ${VERSION}/" CHANGELOG.md

  # Version docs: snapshot the unreleased docs as the new latest version.
  # `next` keeps evolving as the unreleased docs.
  echo "Creating docs version $VERSION..."
  DOCS=docs/content/docs
  rm -rf "$DOCS/latest"
  cp -R "$DOCS/next" "$DOCS/latest"
  node -e '
    const fs = require("fs");
    const [dir, version] = process.argv.slice(1);
    const write = (file, patch) => {
      const meta = { ...JSON.parse(fs.readFileSync(file, "utf8")), ...patch };
      fs.writeFileSync(file, JSON.stringify(meta, null, 2) + "\n");
    };
    write(`${dir}/latest/meta.json`, { title: version, description: "Latest" });
    write(`${dir}/next/meta.json`, { title: "Unreleased", description: "Next" });
  ' "$DOCS" "$VERSION"
  echo "Docs version $VERSION created."
fi
