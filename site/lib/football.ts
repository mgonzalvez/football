import initial from './data/weekly-snapshot.json';
export type Snapshot = typeof initial;
export type Player = Snapshot['roster'][number];
export const total = (roster: Player[]) =>
  Math.round(
    roster
      .filter((p) => p.slot !== 'BN' && p.slot !== 'IR')
      .reduce((s, p) => s + p.projection, 0) * 100,
  ) / 100;
export const eligible = (player: Player, slot: string) =>
  slot === 'FLEX'
    ? ['RB', 'WR', 'TE'].includes(player.position)
    : player.position === slot;
export function swapRoster(roster: Player[], starter: string, bench: string) {
  const a = roster.find((p) => p.name === starter),
    b = roster.find((p) => p.name === bench);
  if (!a || !b || a.slot === 'BN' || b.slot !== 'BN' || !eligible(b, a.slot))
    throw new Error('Choose a starter and an eligible bench player.');
  return roster.map((p) =>
    p.name === a.name
      ? { ...p, slot: 'BN' }
      : p.name === b.name
        ? { ...p, slot: a.slot }
        : p,
  );
}
export function optimize(roster: Player[]) {
  const slots = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'];
  let best = -Infinity,
    bestNames: string[] = [];
  function walk(i: number, names: string[], score: number) {
    if (i === slots.length) {
      if (score > best) {
        best = score;
        bestNames = [...names];
      }
      return;
    }
    for (const p of roster) {
      if (
        p.slot !== 'IR' &&
        eligible(p, slots[i]) &&
        !names.includes(p.name) &&
        !['O', 'IR', 'PUP-R', 'IR-R'].includes(p.status)
      )
        walk(i + 1, [...names, p.name], score + p.projection);
    }
  }
  walk(0, [], 0);
  if (!bestNames.length)
    throw new Error('This roster cannot fill all starting slots.');
  return roster.map((p) => ({
    ...p,
    slot: bestNames.includes(p.name)
      ? slots[bestNames.indexOf(p.name)]
      : p.slot === 'IR'
        ? 'IR'
        : 'BN',
  }));
}
const str = (v: unknown, max = 160): string => {
  if (typeof v !== 'string' || v.length > max)
    throw new Error('Invalid text field in weekly file.');
  return v;
};
const num = (v: unknown, min = 0, max = 10000): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)
    throw new Error('Invalid numeric field in weekly file.');
  return v;
};
const bool = (v: unknown): boolean => {
  if (typeof v !== 'boolean') throw new Error('Invalid status field.');
  return v;
};
const obj = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    throw new Error('Invalid weekly file.');
  return v as Record<string, unknown>;
};
const arr = (v: unknown, max: number): unknown[] => {
  if (!Array.isArray(v) || v.length > max)
    throw new Error('Invalid list in weekly file.');
  return v;
};
const date = (v: unknown) => {
  const s = str(v, 50);
  if (!Number.isFinite(Date.parse(s))) throw new Error('Invalid date.');
  return s;
};
export function validateSnapshot(input: unknown): Snapshot {
  const x = obj(input);
  if (x.schemaVersion !== 1)
    throw new Error('Expected a version 1 weekly file.');
  const roster = arr(x.roster, 30).map((v) => {
    const p = obj(v);
    const position = str(p.position, 5),
      slot = str(p.slot, 5);
    if (
      !['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(position) ||
      !['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF', 'BN', 'IR'].includes(slot)
    )
      throw new Error('Unknown roster position.');
    return {
      name: str(p.name),
      team: str(p.team, 4),
      position,
      slot,
      projection: num(p.projection, -50, 100),
      bye: num(p.bye, 1, 18),
      status: str(p.status, 12),
      opponent: str(p.opponent, 30),
    };
  });
  if (new Set(roster.map((p) => p.name)).size !== roster.length)
    throw new Error('Duplicate roster names.');
  for (const [slot, count] of Object.entries({
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    FLEX: 1,
    K: 1,
    DEF: 1,
  })) {
    if (roster.filter((p) => p.slot === slot).length !== count)
      throw new Error(`Expected ${count} ${slot} starter(s).`);
  }
  if (
    roster.some((p) => !['BN', 'IR'].includes(p.slot) && !eligible(p, p.slot))
  )
    throw new Error('Ineligible starting position.');
  if (
    roster.filter((p) => p.slot === 'BN').length > 6 ||
    roster.filter((p) => p.slot === 'IR').length > 2
  )
    throw new Error('Too many bench or IR players.');
  const games = arr(x.games, 16).map((v) => {
    const g = obj(v),
      home = str(g.home, 4),
      away = str(g.away, 4),
      favorite = str(g.favorite, 4),
      pick = str(g.pick, 4);
    if (
      home === away ||
      ![home, away].includes(favorite) ||
      (pick && ![home, away].includes(pick))
    )
      throw new Error('Invalid game selection.');
    return {
      home,
      away,
      favorite,
      pick,
      spread: num(g.spread, 0, 50),
      kickoff: date(g.kickoff),
    };
  });
  if (new Set(games.flatMap((g) => [g.home, g.away])).size !== games.length * 2)
    throw new Error('Duplicate teams in schedule.');
  const s = obj(x.survivor);
  const sources = arr(x.sources, 30).map((v) => {
    const s = obj(v),
      url = str(s.url, 1000);
    if (new URL(url).protocol !== 'https:')
      throw new Error('Sources must use HTTPS.');
    return { label: str(s.label), url, type: str(s.type, 30) };
  });
  return {
    schemaVersion: 1,
    season: num(x.season, 2020, 2100),
    week: num(x.week, 1, 22),
    updatedAt: date(x.updatedAt),
    researchedAt:
      x.researchedAt === null ? null : (date(x.researchedAt) as never),
    teamName: str(x.teamName),
    opponent: str(x.opponent),
    opponentProjection: num(x.opponentProjection),
    record: str(x.record, 30),
    waiverPriority: num(x.waiverPriority, 1, 10),
    roster,
    survivor: {
      pick: str(s.pick, 4),
      strikes: num(s.strikes, 0, 1),
      eliminated: bool(s.eliminated),
      usedTeams: arr(s.usedTeams, 32).map((v) => str(v, 4)) as never[],
      reuseRuleConfirmed: bool(s.reuseRuleConfirmed),
      deadline: date(s.deadline),
    },
    pickemConfirmed: bool(x.pickemConfirmed),
    games,
    sources,
  };
}
export const pacific = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value)) + ' PT';
export const lockTime = (kickoff: string) =>
  new Date(new Date(kickoff).getTime() - 300000).toISOString();
export function answerQuestion(question: string, data: Snapshot) {
  const q = question.toLowerCase();
  const matches = data.roster.filter((p) =>
    p.name
      .toLowerCase()
      .replaceAll('’', "'")
      .split(' ')
      .some((n) => n.length > 3 && q.replaceAll('’', "'").includes(n)),
  );
  if (matches.length)
    return (
      matches
        .map(
          (p) =>
            `${p.name}: ${p.slot === 'BN' ? 'bench' : p.slot}, ${p.team} ${p.position}, ${p.projection.toFixed(2)} projected points ${p.opponent}. Bye ${p.bye}.${p.status ? ` Snapshot status: ${p.status}; confirm current availability.` : ''}`,
        )
        .join('\n\n') +
      '\n\nSource: your Yahoo roster screenshot. Projections are estimates; this answer does not include fresh injury research.'
    );
  if (/surviv|strike/.test(q))
    return `Your imported survivor selection is ${data.survivor.pick}. ${data.survivor.strikes} strikes recorded. One strike eliminates you. All picks lock ${pacific(data.survivor.deadline)}, five minutes before the first game of the week. Playoffs are included. Team reuse and playoff reset rules still need confirmation.\n\nSource: your Yahoo survivor settings screenshot.`;
  if (/waiver|add|drop/.test(q))
    return `Your waiver priority is ${data.waiverPriority} in a continual rolling list, with a two-day waiver period. The available-player lists are snapshots with multi-game totals, not weekly projections. I need updated projections and player news before ranking adds and drops.\n\nSource: your Yahoo settings and pasted available-player lists.`;
  if (/pick|spread/.test(q))
    return 'Your pick’em pool uses spreads, no confidence points, all weeks count, and no playoffs. Each game locks five minutes before kickoff. The completed screenshot contains 16 selections, but another screenshot was incomplete; confirm your current saved entry. Tiebreakers have separate deadlines.\n\nSource: your Yahoo pick’em screenshots.';
  if (/lineup|start|bench|optimi/.test(q))
    return `Your displayed lineup totals ${total(data.roster).toFixed(2)} projected points. The Lineup Lab can compare legal swaps and maximize the supplied projections. This calculation does not account for fresh injuries, game locks, or updated usage. Check player status before submitting changes in Yahoo.\n\nSource: your Yahoo roster snapshot.`;
  if (/scor|ppr|rule/.test(q))
    return 'Your league is half-PPR: 0.5 per reception, 1 per 10 rushing/receiving yards, 6 per rushing/receiving TD, 1 per 25 passing yards, 4 per passing TD, −1 per interception and −2 per lost fumble. Starters: QB, 2 RB, 2 WR, TE, FLEX, K and DEF.\n\nSource: your Yahoo league settings screenshots.';
  if (/trade/.test(q))
    return 'Trade review is by the commissioner, with a one-day rejection period. The deadline is November 28, 2026. Upload other teams’ rosters for partner-specific trade suggestions; they are not available in this report.\n\nSource: your Yahoo league settings screenshot.';
  return 'That question needs information beyond this saved report. Use “Copy research prompt” to take your question and current league context into an external assistant session. I do not have live web access inside this dashboard.';
}
