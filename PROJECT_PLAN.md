# Personal Fantasy Football Dashboard

> Original design plan. The shipped product is Metlife Crisis. Consult README.md and docs/ for current behavior. Ranked waivers/trades, researched pick recommendations, a structured news/report renderer, results history, and fully data-driven weekly copy remain future work. The optimizer uses supplied projections rather than calculating scoring from raw statistics.

## Goal and agreed constraints

Build a polished personal dashboard for tracking fantasy football, optimizing lineups, evaluating waivers and trades, and making survivor and pick'em decisions. Use free screenshot-assisted updates, GitHub Pages hosting, and an unshared public URL. Provide weekly briefings and an assistant interface. No paid data or AI dependency in the first version.

## Confirmed competition settings

Source: user-supplied Yahoo screenshots inspected September 7, 2026. These are snapshots, not live account data.

- Family Fantasy Football League, ID 1372068, team 6: Martin Big Blue Wrecking Crew. Ten teams, head-to-head, half-PPR.
- Starters: QB, two RB, two WR, TE, W/R/T FLEX, K, DEF. Six bench and two IR slots.
- Passing: 25 yards/point, four points/TD, minus one/interception. Rushing and receiving: 10 yards/point, six points/TD. Receptions: 0.5. Fumbles lost: minus two. Store all remaining kicker and defense scoring from the screenshots during implementation.
- Continual rolling waiver priority, two-day waiver time, weekly waivers Game Time–Tuesday. Current screenshot priority: seven. No acquisition or trade count limits.
- Commissioner trade review, one-day rejection period, trade deadline November 28, 2026. No draft-pick trades.
- Four fantasy playoff teams, weeks 16–17, reseeding, higher seed wins playoff ties.
- Survivor: FourthandLong, group 29886, entry 4, Metlife Crisis. One pick/week, one strike eliminates, playoffs included. Deadline five minutes before the first game of each week. Week 1 screenshot selection: Jacksonville. Team-reuse and postseason reset details remain unverified.
- Pick'em: FourthandLong, group 38375, entry 5, Metlife Crisis. Against the spread, no confidence points, tiebreakers enabled, all weeks count, no playoffs. Deadline five minutes before each game. Separate tiebreaker deadlines must also be recorded.
- Pick'em screenshots include both an incomplete entry and a completed entry. Preserve their provenance; confirm the authoritative snapshot during import instead of treating file order as chronology.

## Experience and visual direction

Final name: Metlife Crisis, a pun on MetLife Stadium and midlife crisis. Use occasional light Giants-themed humor without obscuring decisions or deadlines. Deep navy surfaces, electric blue accents, high-contrast text, restrained status colors, player/team imagery, generous spacing, and subtle motion respecting reduced-motion preferences. Responsive desktop navigation and compact mobile navigation. Avoid clutter and decorative metrics.

The first screen answers: what needs attention, what action is recommended, why, and by when? Show week selector, last-researched time, last screenshot update, next deadline in the user's timezone, matchup summary, survivor status, and pick'em completion.

Views:

1. This Week: prioritized actions, relevant news, matchup, competition summaries, and weekly briefing.
2. Lineup Lab: starters/bench, legal lineup comparison using league scoring, projected changes, injury contingencies, and FLEX timing. Clearly distinguish supplied projections from analyst judgments.
3. Waivers & Trades: ranked available additions with corresponding drops, waiver-priority implications, roster needs, trade comparisons and partner fit when other rosters are supplied.
4. Survivor: saved pick, recommended alternatives, used-team history, future value, popularity context and elimination status. Never confuse win probability with probability of covering a spread.
5. Pick'em: Yahoo contest spread, saved selection versus recommendation, reasoning, uncertainty, tiebreakers, game locks and results. Preserve the contest's line separately from any newer market line.
6. Analyst: conversational access to saved weekly findings and contextual question prompts.
7. Update & History: data freshness, missing inputs, change summaries and archived weekly reports.

## Free assistant boundary

The site provides prepared analysis and a local conversational lookup over the current report: player comparisons, explanations, cited findings and suggested follow-up questions. Label it as answering from the saved briefing. It must say when a question is unsupported or needs fresh research.

For open-ended or current questions, offer a copyable prompt containing the relevant roster, rules, week and question for use in an external assistant session. Answers can be added to the next report. This handoff is not embedded live AI. Fully generative live chat remains a later optional integration, requiring separate feasibility and cost decisions.

## Weekly update workflow

1. User adds current roster/matchup, survivor and pick'em screenshots to the local input folder. Add available-player lists for waiver analysis and other rosters for trade analysis.
2. During an explicitly requested update session, extract the screenshots into structured weekly records. Check names, positions, week, screenshot freshness, spreads, saved status and ambiguous values. Flag conflicting inputs.
3. Research current relevant information using official NFL/team injury reports and announcements, primary statistics and weather sources, plus clearly attributed established fantasy analysis when accessible. Record links, publication dates and research timestamps. Do not claim automatic monitoring between sessions.
4. Prepare the weekly briefing and recommendations. Every recommendation includes action, rationale, evidence, uncertainty and contingencies. Avoid unsupported numerical confidence or invented projections.
5. Validate the data and preview the dashboard. Publish sanitized site files through the GitHub workflow when deployment is authorized. Archive prior weeks rather than overwriting history.

Suggested update rhythm: early-week recap/waivers, before the week's first kickoff for survivor and picks, and a pre-Sunday injury/lineup refresh. Additional updates are user-triggered. On-site edits or imports may be saved locally and exported; persisting them to the hosted site requires the publishing workflow.

## Technical plan

Use a static frontend with versioned JSON files for settings, roster, matchup, available players, picks, results, research and recommendations. Keep rendering independent of weekly data so updates do not require changing UI code. Use lightweight browser-side comparison, filtering, deadline displays and saved-report lookup. No Yahoo credentials or paid API keys in browser code.

Deploy only a dedicated build output to GitHub Pages; support repository subpaths. Keep raw screenshot inputs local and excluded from version control and deployment: supplied settings images contain group passwords. Publish only explicitly selected structured fields, never those passwords. An unshared URL is public, as accepted by the user.

Suggested data records: league-settings.json; season/week-NN/{snapshot,research,recommendations,results}.json. Each imported field or record should retain source filename and capture-time information where known. Mark unknown capture times rather than inventing them. Recommendations and saved Yahoo decisions are distinct states.

## Build sequence and acceptance criteria

1. Foundation: transcribe verified rules and roster, build responsive shell and This Week view, seed snapshot data, add timestamps and missing-data states.
2. Decision tools: lineup comparisons, survivor and spread-pick views, waiver/trade report components and cited weekly briefing.
3. Assistant and updates: saved-report conversational lookup, external-question handoff, weekly import/export and archive workflow.
4. Verification and publishing: check roster legality, half-PPR scoring, separate lock rules, contest lines, stale-data handling, keyboard/mobile usability, GitHub Pages paths and exclusion of raw screenshots/secrets.

Success means the user can understand the top weekly actions within a minute, inspect the reasoning for each, distinguish saved selections from suggestions, and request a weekly refresh by supplying screenshots without editing code. The site must not imply live scores, news monitoring, Yahoo submissions or generative AI capabilities that have not been implemented.

## Remaining inputs

Enough information is available to begin the dashboard. For a useful first recommendation report, obtain the current opponent's complete lineup and available-player screenshots with projections and waiver status. Other teams' rosters enable targeted trade proposals. Survivor member counts/standings and team-reuse/postseason rules improve pool strategy. Confirm which pick'em snapshot reflects the currently saved entry at the first update.
