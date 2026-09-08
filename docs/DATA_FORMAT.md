# Weekly JSON format, version 1

The working example is [the bundled snapshot](../site/lib/data/weekly-snapshot.json). Copy that complete file rather than creating a partial update. The executable import validator is `validateSnapshot` in [football.ts](../site/lib/football.ts); there is no separate JSON Schema file.

## Required top-level fields

| Field | Meaning / accepted value |
| --- | --- |
| `schemaVersion` | Exactly `1` |
| `season`, `week` | Numbers in 2020–2100 and 1–22 respectively; use whole numbers |
| `updatedAt` | Parseable date string. Prefer `YYYY-MM-DD` for snapshot date |
| `researchedAt` | `null` or parseable date string; currently not used to render research |
| `teamName`, `opponent` | Strings, up to 160 characters each |
| `opponentProjection` | Finite number, 0–10000 |
| `record` | String, up to 30 characters; retained even where not displayed |
| `waiverPriority` | Number, 1–10; use a whole number |
| `roster` | Array of player objects below, maximum 30; roster rules further restrict size |
| `survivor` | Object below |
| `pickemConfirmed` | Boolean; set true only after confirming the authoritative saved selections |
| `games` | Up to 16 game objects below |
| `sources` | Up to 30 source objects below |

## Player object

```json
{
  "name": "Brock Purdy",
  "team": "SF",
  "position": "QB",
  "slot": "QB",
  "projection": 17.96,
  "bye": 8,
  "status": "",
  "opponent": "@ LAR"
}
```

Names must be unique. `position` is QB, RB, WR, TE, K or DEF. `slot` is one of those plus FLEX, BN or IR. Exactly nine starters are required: QB, 2 RB, 2 WR, TE, FLEX, K, DEF. FLEX allows RB/WR/TE; other starting slots must match position. Up to six BN and two IR players are allowed. Empty starting slots cannot currently be imported.

`projection` is a finite number from -50 to 100, already scored for the league. `bye` is 1–18; use a whole number. Team strings are at most four characters, status strings at most 12, and opponent strings at most 30. Use consistent NFL abbreviations; the validator does not check an NFL team directory.

The optimizer excludes IR-slot players and exact status strings `O`, `IR`, `PUP-R`, `IR-R`. Questionable players remain eligible. Other status labels are not interpreted, so verify their meaning manually. A legal manual swap does not perform an injury or game-lock check.

## Survivor object

```json
{
  "pick": "JAX",
  "strikes": 0,
  "eliminated": false,
  "usedTeams": [],
  "reuseRuleConfirmed": false,
  "deadline": "2026-09-09T17:15:00-07:00"
}
```

All fields are required. Team strings are at most four characters; `usedTeams` allows up to 32 strings. Strikes range from 0 to 1. Use booleans for elimination and rule confirmation. The validator does not cross-check elimination against strikes or confirm reuse eligibility. The current planner flags used teams but does not enforce a reuse rule.

## Game object

```json
{
  "away": "NE",
  "home": "SEA",
  "favorite": "SEA",
  "spread": 3.5,
  "pick": "NE",
  "kickoff": "2026-09-09T17:20:00-07:00"
}
```

Home and away must differ. Favorite must be one of the two teams. Store the spread as a nonnegative magnitude from 0 to 50; the interface adds the minus sign to the favorite. Pick must be one of the teams or `""` for unentered. A team cannot appear in more than one game in the weekly list. Keep games ordered by kickoff because the overview uses the first entry for its first-game deadline.

Use ISO timestamps with explicit offsets for kickoff and survivor deadline. The parser accepts broader date strings, but timezone-free timestamps are ambiguous. Pick’em lock is calculated as kickoff minus five minutes. Store Yahoo’s contest line, not a replacement market line.

## Source object

```json
{
  "label": "Yahoo fantasy roster · supplied screenshot",
  "url": "https://football.fantasysports.yahoo.com/f1/1372068/6",
  "type": "snapshot"
}
```

Label is at most 160 characters, URL at most 1000 and type at most 30. Only HTTPS URLs are accepted. Keep the first three sources in fantasy, survivor, pick’em order: the Yahoo buttons currently use those array positions. Source links do not fetch page contents. The current source panel labels every source with the snapshot date rather than a separate publication date.

## Import boundaries

All listed fields are required. Unknown fields are discarded when importing; they are not a way to add recommendations, results or tiebreakers. Strings are displayed as React text, not interpreted as HTML. Validation checks structure and basic consistency, not current player availability, projection accuracy or deadline correctness.

Available players are separate bundled files. Their `reported_fantasy_points` fields are multi-game totals of an unconfirmed period, not weekly projections. Weekly snapshot import/export does not include them.
