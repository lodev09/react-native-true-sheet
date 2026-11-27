# Website

Built with [Fumadocs](https://fumadocs.dev) on Next.js.

```
content/
├── docs/
│   ├── latest/ # Current release, served at /
│   ├── next/   # Unreleased, served at /next
│   └── v3/     # Previous major, served at /v3
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

Stable releases are versioned automatically by `scripts/release.sh` (release-it's `after:bump` hook): it replaces `content/docs/latest` with a copy of `content/docs/next` and sets the `latest` `meta.json` title to the released version. On a major bump, the outgoing `latest` is archived to `content/docs/v<major>` (e.g. `v3`) instead of being replaced, and added to the version switcher. Pre-releases skip this step. Keep `next` as the place to document unreleased changes.

Until `content/docs/v3` exists, `/v3/*` redirects to the root (`next.config.mjs`). Once it's archived, `/v3/*` serves the archive and bare `/v3` redirects to `/v3/intro`.
