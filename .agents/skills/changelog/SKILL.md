---
name: changelog
description: Add, extend, or skip the CHANGELOG.md entry for a TrueSheet pull request — decide whether the change shipped, pick the section and platform, write the entry in the repo's style, credit the authors, and commit it to the PR branch. Use right after creating a PR, when asked to add or update a changelog entry, or when checking whether a PR needs one.
metadata:
  internal: true
---

# Changelog

Every user-facing PR is recorded once in `## Unreleased` of `CHANGELOG.md`. Add the entry right after `gh pr create`, on the PR branch, so it lands with the squash merge. `scripts/release.sh` turns `Unreleased` into the version heading on stable releases only (betas skip it).

## 1. New entry, extend, or skip

"Shipped" means in the latest stable release: `git describe --tags --abbrev=0 --exclude '*-*' origin/v3` (e.g. `v3.11.18`). `main` is the unreleased v4; its betas don't count — a PR already published in a `v4.0.0-beta.*` is still unreleased, and so is any bug it introduced.

- **Extend** an existing Unreleased entry when the PR follows up on it: a fix for a bug that never shipped, polish for an unreleased feature, a second PR of the same change, or another update to the same skill, guide, or example upgrade. Append the PR link (and any new contributors) and reword only if the behavior described changes. E.g. #911 + #919 + #925 (`dimColor`), #784 + #796 + #848 + #983 (scrollable bottom inset), #904 + #923 (`e2e` skill), #799 + #848 + #877 (`truesheet-usage` skill).
  - A bug never shipped when its code only exists in Unreleased (`git show <tag>:<path>` fails or lacks it) or it came from an Unreleased PR, including one already out in a beta. Extend the entry of the PR that introduced the code: find the commit with `git log -S '<code>' -- <path>`. PRs merged into the `v4` branch are squashed into #751 on `main`, so match those by feature.
- **Skip** changes nobody using or contributing to the library would notice: small docs notes, CI, tests, example-only build fixes. Also skip a fix for code whose introducing PR has no entry to extend.
- **New entry** otherwise.

## 2. Section and platform

| Section               | For                                                               | Commit type                 |
| --------------------- | ----------------------------------------------------------------- | --------------------------- |
| `🎉 New features`     | New props, events, methods, components, platform support          | `feat`                      |
| `🐛 Bug fixes`        | Fixed behavior                                                    | `fix`                       |
| `💥 Breaking changes` | Anything requiring user action to upgrade                         | `!` (e.g. `refactor!`)      |
| `💡 Others`           | Docs, guides, examples, agent skills, internal refactors, tooling | `docs`, `chore`, `refactor` |

One entry per PR, under its primary section, even when it touches several.

Prefix `**iOS**:`, `**Android**:`, or `**Web**:` when the change is limited to one platform (the commit scope usually says, e.g. `fix(android)`); no prefix when it spans platforms. Within a section, keep entries grouped iOS → Android → Web → unprefixed, and add the new one at the end of its group.

## 3. Write it

```md
- **Android**: Grabber colors now support `PlatformColor` resource references as well as static colors. ([#916](https://github.com/lodev09/react-native-true-sheet/pull/916) by [@hukpo](https://github.com/hukpo))
```

Several PRs or authors:

```md
([#911](https://github.com/lodev09/react-native-true-sheet/pull/911), [#919](https://github.com/lodev09/react-native-true-sheet/pull/919) by [@IjzerenHein](https://github.com/IjzerenHein), [@nickcernera](https://github.com/nickcernera) and [@lodev09](https://github.com/lodev09))
```

- One or two short sentences on what the user sees. No implementation details (native classes, internal flags, how it was fixed).
- Bug fixes state the fixed behavior: "X no longer Y", "X now Y" — not "Fixed a bug where".
- Features say what's new and what it's for: "Added `dismissThreshold` on Android and Web. Set it to `'short'` to ...".
- Breaking changes say what changed and what to do: "... — pass `flex: 1` via `style` to fill."
- Props, events, methods, and values go in backticks.

Credits: the PR author plus commit co-authors who contributed real changes, and the author of any PR this one supersedes (#909 credits #906's author). `@lodev09` goes last. Join with `, ` and a final `and`.

```sh
gh pr view <n> --json author,commits --jq '[.author.login] + [.commits[].authors[].login] | unique'
```

## 4. Commit

On the PR branch:

```sh
git add CHANGELOG.md
git commit -m "docs: add changelog entry for #<n>"      # "docs: update changelog entry for #<n>" when extending
git push
```

Then make sure "I added a changelog entry (if needed)" is ticked in the PR body. Skipped entries need no commit; say why in the PR or to the user.
