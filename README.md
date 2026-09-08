# Metlife Crisis

A personal fantasy football dashboard for Martin’s family league, survivor pool, and against-the-spread pick’em. Built for https://github.com/mgonzalvez/football and GitHub Pages at https://mgonzalvez.github.io/football/.

## Documentation

- [Weekly updates and recovery](docs/WEEKLY_UPDATES.md): what to supply, import versus publish, backups and current manual steps.
- [Weekly data format](docs/DATA_FORMAT.md): required fields, examples and validation limits.
- [Maintenance and deployment](docs/MAINTENANCE.md): source map, publishing, troubleshooting and rollback.
- [Original project plan](PROJECT_PLAN.md): design intent and future scope, not a list of completed features.

## Run locally

Requires Node 22.13 or newer.

```sh
cd site
npm ci
npm run dev
```

Open the local URL printed by the server. Development runs at `/`; the production assets target `/football/`.

## What works

- Weekly matchup and snapshot-based briefing.
- Legal starter/bench swaps and highest-projection lineup scenarios using half-PPR Yahoo projections.
- Search and position filters for 50 available-player snapshots; trade rules and missing-data guidance.
- Survivor and pick’em scenario planning, with separate lock rules and browser-local persistence.
- Saved-report assistant with a copyable context prompt for fresh external research.
- Validated weekly JSON import/export and browser-local archive.

The site does not submit Yahoo changes, fetch live scores, monitor news, or provide embedded generative AI. Lineup calculations use supplied projections and require a human check of injuries and Yahoo game locks. The first report contains screenshot-derived observations, not researched waiver/pick recommendations.

## Weekly updates

1. Add roster, matchup, available-player, survivor and pick’em screenshots to the local `data ` folder (the existing name has a trailing space).
2. Request an update session to transcribe the data, verify current relevant sources, and prepare analysis. Raw screenshots must stay local.
3. Import does not update the separate waiver pool, hardcoded Week 1 labels or tiebreaker prose. Those currently require source edits; see the weekly guide.
4. The canonical bundled snapshot is `site/lib/data/weekly-snapshot.json`. Update the two available-player JSON files alongside it as needed. Historical point totals are explicitly not weekly projections.
5. Import a prepared weekly JSON in Updates & history for a local preview, or replace the bundled snapshot and publish a new build. Browser imports never publish automatically.
6. Export snapshots as backups. Browser-local drafts and archives do not synchronize between devices. Export currently includes the imported snapshot, not local pick scenarios.

The selected week comes from the snapshot or local archive; the app does not silently advance to an empty week. An imported snapshot must match the version 1 schema, legal roster configuration, and safe HTTPS source links. Source files in `planning/` retain the initial inputs and plan.

## Publish on GitHub Pages

Push this project to the repository’s `main` branch. In **Settings → Pages**, choose **GitHub Actions** as the source. The included workflow installs dependencies, runs rule tests and type checks, builds the static export, and deploys only `site/out`.

```sh
cd site
npm test
npm run typecheck
npm run build
```

The app uses `/football` as its production asset prefix, with a build step that stages the export at the GitHub Pages repository root. A path change also requires updating the favicon and packaging script; see the maintenance guide. The output is static and needs no server or API key. The site requests no search indexing, but the URL is public.

## Input privacy

Root `.gitignore` excludes root-level `/data*/` folders: settings screenshots contain group passwords. Only sanitized JSON is bundled. Never move raw screenshots or secrets into `site/public`, the build output, or tracked files. The Pages workflow uploads only the static export.

## Validation

Automated tests cover legal swaps, optimization, roster validation, source URL handling, point totals, lock rules, and the saved-report assistant. Browser visual/interaction QA was not requested and was not performed; no browser was available for the preview handoff. Optional WebMCP read/compare tools are feature-detected; no compatible validation context was available.
