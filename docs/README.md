# Website

Built with [Fumadocs](https://fumadocs.dev) on Next.js.

```
content/
├── docs/
│   ├── latest/ # Current release, served at /
│   └── next/   # Unreleased, served at /next
└── blog/
```

Each folder under `content/docs` is a version root (`"root": "version"` in its `meta.json`). Fumadocs renders the version switcher from these folders, labelled by their `title`. The `latest` folder prefix is stripped from URLs in `lib/source.ts`.

## Development

```
yarn docs dev
```

## Build

```
yarn docs build
```

## Versioning

Stable releases are versioned automatically by `scripts/release.sh` (release-it's `after:bump` hook): it replaces `content/docs/latest` with a copy of `content/docs/next` and sets the `latest` `meta.json` title to the released version. Pre-releases skip this step. Keep `next` as the place to document unreleased changes.
