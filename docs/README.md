# Website

Built with [Fumadocs](https://fumadocs.dev) on Next.js.

```
content/
├── docs/
│   ├── v3/     # 3.11.13, served at /v3
│   └── next/   # Unreleased, served at /next
└── blog/
```

Each folder under `content/docs` is a version root (`"root": "version"` in its `meta.json`). Fumadocs renders the version switcher from these folders.

## Development

```
yarn docs dev
```

## Build

```
yarn docs build
```

## Versioning

To cut a release, rename `content/docs/next` to the new version folder (for example `v4`), update its `meta.json` title, copy it to a fresh `next`, and add redirects in `next.config.mjs` if the default version changes.
