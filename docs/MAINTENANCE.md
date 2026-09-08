# Maintenance and deployment

## Source map

| Path | Responsibility |
| --- | --- |
| `site/app/page.tsx` | Static route wrapper |
| `site/app/dashboard.tsx` | Navigation, overview, browser persistence, imports and optional WebMCP registration |
| `site/app/views.tsx` | Lineup, waivers/trades, survivor, pick’em, analyst and update screens |
| `site/app/globals.css` | Theme, layout, responsive styles |
| `site/app/layout.tsx` | Page metadata and favicon path |
| `site/lib/football.ts` | Import validation, legal swaps, projection optimizer, deadlines and rule-based answers |
| `site/lib/data/` | Canonical bundled data |
| `planning/` | Original transcriptions; not the live data source |
| `site/scripts/prepare-pages.mjs` | Stages and verifies the GitHub Pages artifact |
| `.github/workflows/pages.yml` | Checks, build and Pages deployment |

The stack is React, Vinext/Vite and the scaffold’s Shadcn/Base UI components. There is no runtime backend, database, account connection or AI API. `.openai/hosting.json` is scaffold metadata; GitHub Actions is the actual deployment mechanism. Preserve the package lockfile; its download URLs use the public npm registry so CI does not depend on a workstation’s internal mirror.

## Check and publish

Run from `site/`:

```sh
npm ci
npm test
npm run typecheck
npm run build
```

The eight initial tests cover domain rules and imports. Build verifies static HTML and its referenced assets. Neither proves browser interaction or visual correctness. Browser QA and optional WebMCP contract validation remain unperformed.

After reviewing the changes, commit and push them to `main`. The workflow repeats the checks, builds `site/out`, and deploys it. Confirm the latest run succeeds in [GitHub Actions](https://github.com/mgonzalvez/football/actions), then open [the live dashboard](https://mgonzalvez.github.io/football/). Do not treat a successful local build as a completed deployment.

For a docs-only change, check links and factual consistency; local application tests need not be rerun. The current workflow still runs all checks on every push to `main`.

## Static hosting details

Development runs at `/`. Production assets use `/football`. Vinext exports into `site/dist/client`; the packaging script recreates `site/out` and moves the emitted prefix directory’s assets into the shape GitHub Pages expects. `site/out`, build caches and dependencies are ignored by Git.

If changing the repository path, update **all three**: `site/next.config.ts` asset prefix, `site/app/layout.tsx` favicon path, and the hardcoded prefix in `site/scripts/prepare-pages.mjs`. Also update documentation and deployment target. Changing only the Next config is insufficient.

The packaging script copies HTML, RSC, favicon and `_next` assets; it does not copy arbitrary public files. It currently rejects PNG/JPEG/env files in the output. If adding legitimate player portraits or other public assets, intentionally revise packaging and inspect the resulting artifact before publishing.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Dashboard still shows an old week after deployment | Browser storage takes precedence over the bundle. Export your work, then import the new file or choose Restore original |
| Import fails | Use a complete exported file; check required fields, numerical values, exact starting slots, unique players/teams and HTTPS source URLs |
| Waiver or tiebreaker text did not change after import | Those inputs and labels are outside the weekly schema; see the weekly update guide |
| Build succeeds but Pages is missing | Check Settings → Pages uses GitHub Actions and inspect the latest deploy job |
| HTML loads but styling/scripts fail | Check `/football` prefix consistency and that the workflow uploads `site/out`, not `site/dist/client` or the source folder |
| Package installation fails on GitHub | Inspect the failure log and lockfile URLs; do not replace versions or delete the lockfile blindly |
| Local build reports `listen EPERM` | Vinext prerendering needs a temporary loopback socket. Run the build in an environment that permits it; in a sandboxed agent session use its normal approval flow |
| Fresh research does not appear in chat | Chat is a rule-based responder. It does not ingest linked articles or arbitrary recommendation fields |

## Roll back

Use `git revert <commit>` on the identified bad change, review the revert, and push to `main`; this preserves history and triggers a new deployment. For data-only mistakes, restore the prior bundled data and any associated labels in a new commit. Confirm deployment success. A rollback does not remove an existing browser’s saved snapshot; switch or restore that separately.

## Data protection

The root ignore rule `/data*/` excludes matching folders at the repository root, not every nested folder named data. Sanitized `site/lib/data` is intentionally tracked and public. Ignore rules do not untrack files already committed. Before adding a new input location, ensure raw files cannot enter Git or `site/public`.

The repository and Pages URL are public. Robots directives discourage indexing; they are not access control. Source comments and bundled JSON are also public. Do not store passwords or account tokens anywhere in tracked source. If a secret is accidentally committed, removing it in a later commit does not erase its history; replace the exposed credential and handle repository history separately.
