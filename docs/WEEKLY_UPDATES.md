# Weekly updates and recovery

This guide describes the shipped version. The dashboard is a static snapshot viewer and scenario planner; uploading screenshots does not automatically extract data or research news.

## What to supply

Add dated screenshots or pasted text to the local `data ` folder (the existing folder name has a trailing space). Include:

- Full roster, bench/IR, weekly projections, injury tags and opponent matchup.
- Available-player lists with selected stats period visible, waiver status and weekly projections.
- Survivor entry, previous picks, group standings and any changed rules.
- Pick’em saved selections, Yahoo contest spreads, kickoff times and tiebreakers.
- Other teams’ rosters when requesting trade analysis.

Capture league settings again only if they change. Raw settings images contain passwords and must remain outside tracked files and public assets. Use capture dates to resolve conflicting screenshots; do not assume the newest filename represents the authoritative saved selection.

Suggested request:

> Update Metlife Crisis for Week [number] using the new local screenshots. Confirm ambiguous entries, research relevant current information with dated source links, and identify any website changes needed to display the findings. Keep raw screenshots and passwords local. Validate the update before publishing.

## What changes where

| Change | Required location or action |
| --- | --- |
| Roster, projections, matchup, survivor entry, games, picks, source links | `site/lib/data/weekly-snapshot.json` or a validated browser import |
| Available-player pool | Both `site/lib/data/available-players-page-*.json` files; not part of weekly import |
| Waiver counts/date labels and Week 1 explanatory text | Currently in `site/app/dashboard.tsx` and `site/app/views.tsx`; review during every weekly refresh |
| Tiebreaker entries | Currently prose in `site/app/views.tsx`; not part of weekly import |
| Scoring rules and trade rules | Currently in `site/lib/football.ts` and `site/app/views.tsx`; not a configurable league-settings file |
| Researched recommendations and news | No structured report renderer yet. Adding a source URL or `researchedAt` does not make the assistant read an article or produce new advice |

Research can be delivered separately in an update session. Displaying richer recommendations inside the site requires an implementation change; do not present that as a JSON-only update.

## Import, save and publish are different

1. Start from **Export snapshot** or the bundled JSON; see [the data format](DATA_FORMAT.md).
2. In **Updates & history**, import the prepared JSON. The app validates it and stores it in this browser. Importing the same season/week replaces that week’s local archive entry.
3. Inspect the selected week, projections, saved picks, dates and source links. Imports do not validate facts against Yahoo.
4. To publish for every device, replace the bundled data and update the source-only labels listed above, then run the checks and push to `main`. See [maintenance](MAINTENANCE.md).

The app loads browser-saved data before the current bundled snapshot. After a deployment, an existing browser can therefore continue showing an older local week. Import the new file or use **Restore original** to select the snapshot bundled with the current deployment. The button’s success message currently says “Week 1” even if the bundle has been updated.

## Persistence and backups

| Item | Survives page reload? | Included in Export snapshot? |
| --- | --- | --- |
| Currently imported snapshot | Yes, when browser storage works | Yes |
| Other local archived weeks | Yes | No; open and export each separately |
| Survivor/pick’em local scenarios | Yes | No |
| Lineup scenario swaps | No; also reset when leaving the view | No |
| Analyst conversation | No; also resets when leaving the view | No |

Storage is device/browser-specific, under `metlife-crisis-v1`. There is no account sync. Export each important snapshot before clearing site storage. Record local pick scenarios separately if you want to keep them. **Restore original** selects the deployed bundle but keeps imported archives and local pick scenarios.

If importing fails, the active snapshot stays unchanged. Check the file is JSON, smaller than 1 MB, and has every required field and a legal starting lineup. If old or broken local state persists, export what you need and clear this site’s browser storage; that removes all local archives and scenarios.

## Before using decisions

- Verify injuries and game locks in Yahoo. The optimizer only maximizes supplied projections; it does not recalculate scoring from player statistics.
- Survivor locks once per week before the first game. Pick’em locks each game separately. Tiebreakers have separate Yahoo deadlines.
- Lock displays use the device clock and Pacific time. Correct the device clock if a lock looks wrong.
- Submit actual lineup changes and selections in Yahoo. The dashboard’s buttons only plan local scenarios.
