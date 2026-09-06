# Website

Built with [Fumadocs](https://fumadocs.dev) on Next.js.

```
content/
├── docs/   # 3.11.13 (served at /)
├── next/   # Unreleased (served at /next)
└── blog/
```

## Development

```
yarn docs dev
```

## Build

```
yarn docs build
```

## Versioning

To cut a new version, copy `content/next` over `content/docs` and update the labels in `lib/source.ts`.
