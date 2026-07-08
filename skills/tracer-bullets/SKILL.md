---
name: tracer-bullets
description: >-
  Use when starting or expanding a feature, risky refactor, cross-layer change, or uncertain implementation.
  Guides the agent to build a tiny end-to-end slice first, validate the architecture quickly, seek feedback,
  then expand from a working path instead of designing the whole system upfront.
---

# Tracer Bullets

Build the smallest useful slice that travels through the real system before expanding the feature.

## Workflow

1. Define the desired outcome in one sentence.
2. Pick the thinnest end-to-end path that proves the core shape works.
3. Implement only that path through the real layers, using production code paths where possible.
4. Validate it with the fastest meaningful check: a focused test, local run, simulator flow, or observable UI/API behavior.
5. Report what the slice proves, what remains deliberately incomplete, and what feedback would change the direction.
6. Expand from the working slice in small increments, validating each meaningful step.

## Slice Rules

- Prefer real integration points over mocks unless the mock is the only way to get fast feedback.
- Keep placeholders obvious and local; do not let scaffolding look like finished behavior.
- Preserve a runnable path at every step.
- When architecture is uncertain, make the tracer bullet answer the riskiest question first.
- Stop to seek feedback when the first slice changes the product behavior, data shape, public API, or developer workflow.

## Report Format

Use this short shape when handing off the first slice:

```markdown
Tracer bullet:

- Proves:
- Left out:
- Validation:
- Next expansion:
```
