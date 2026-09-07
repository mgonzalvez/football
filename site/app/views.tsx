'use client';
import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowLeftRight,
  Sparkles,
  Download,
  Copy,
  Send,
  ShieldCheck,
  Clock,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import page1 from '@/lib/data/available-players-page-1.json';
import page2 from '@/lib/data/available-players-page-2.json';
import {
  type Snapshot,
  type Player,
  total,
  eligible,
  swapRoster,
  optimize,
  pacific,
  lockTime,
  answerQuestion,
} from '@/lib/football';
export const available = [...page1.players, ...page2.players];
export function SourceLink({
  data,
  index = 0,
}: {
  data: Snapshot;
  index?: number;
}) {
  return (
    <a
      className="link"
      href={data.sources[index]?.url}
      target="_blank"
      rel="noreferrer"
    >
      Open Yahoo <ArrowUpRight size={15} />
    </a>
  );
}
export function PlayerTable({ players }: { players: Player[] }) {
  return (
    <Table className="data-table">
      <TableHeader>
        <TableRow>
          <TableHead>Slot</TableHead>
          <TableHead>Player</TableHead>
          <TableHead>Matchup</TableHead>
          <TableHead>Bye</TableHead>
          <TableHead className="num">Proj.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((p) => (
          <TableRow key={p.name}>
            <TableCell>
              <span className="position">{p.slot}</span>
            </TableCell>
            <TableCell>
              <div className="player-cell">
                <span className="team-chip">{p.team}</span>
                <div>
                  <div className="player-name">
                    {p.name}{' '}
                    {p.status && <span className="pill amber">{p.status}</span>}
                  </div>
                  <div className="player-sub">
                    {p.team} · {p.position}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell className="muted">{p.opponent}</TableCell>
            <TableCell className="muted">{p.bye}</TableCell>
            <TableCell className="num">{p.projection.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="field">
      {label}
      <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
        <SelectTrigger aria-label={label}>
          <SelectValue>
            {options.find((o) => o.value === value)?.label ?? 'Choose player'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
export function Lineup({ data }: { data: Snapshot }) {
  const [roster, setRoster] = useState(data.roster),
    [tab, setTab] = useState('all'),
    [starter, setStarter] = useState(''),
    [bench, setBench] = useState(''),
    [msg, setMsg] = useState('');
  const a = roster.find((p) => p.name === starter),
    b = roster.find((p) => p.name === bench);
  const delta = b && a ? b.projection - a.projection : null;
  function swap() {
    try {
      setRoster(swapRoster(roster, starter, bench));
      setStarter('');
      setBench('');
      setMsg(
        'Lineup scenario updated locally. Submit any actual changes in Yahoo.',
      );
    } catch (e) {
      setMsg((e as Error).message);
    }
  }
  return (
    <>
      <div className="two-col">
        <section className="panel panel-pad">
          <div className="panel-head">
            <h2>Find your best nine</h2>
            <span className="pill">Half-PPR</span>
          </div>
          <div className="score">
            {total(roster).toFixed(2)}{' '}
            <span className="small">projected points</span>
          </div>
          <p className="small" style={{ margin: '12px 0 20px' }}>
            Imported lineup: {total(data.roster).toFixed(2)} · Scenario change:{' '}
            {(total(roster) - total(data.roster)).toFixed(2)}
          </p>
          <div className="toolbar">
            <button
              className="btn primary"
              onClick={() => {
                try {
                  setRoster(optimize(roster));
                  setMsg(
                    'Highest supplied-projection lineup calculated. Questionable players remain eligible; verify availability and locks in Yahoo.',
                  );
                } catch (e) {
                  setMsg((e as Error).message);
                }
              }}
            >
              <Sparkles />
              Maximize projections
            </button>
            <button
              className="btn"
              onClick={() => {
                setRoster(data.roster);
                setStarter('');
                setBench('');
                setMsg('Restored the imported lineup.');
              }}
            >
              Reset scenario
            </button>
          </div>
        </section>
        <section className="panel panel-pad">
          <h2>Compare a swap</h2>
          <div className="swap-box">
            <Picker
              label="Move to bench"
              value={starter}
              onChange={(v) => {
                setStarter(v);
                setBench('');
              }}
              options={roster
                .filter((p) => !['BN', 'IR'].includes(p.slot))
                .map((p) => ({ value: p.name, label: p.name }))}
            />
            <Picker
              label="Start instead"
              value={bench}
              onChange={setBench}
              options={roster
                .filter((p) => p.slot === 'BN' && a && eligible(p, a.slot))
                .map((p) => ({ value: p.name, label: p.name }))}
            />
            <button className="btn" disabled={!a || !b} onClick={swap}>
              <ArrowLeftRight />
              Swap
            </button>
          </div>
          <p className="small">
            {delta === null
              ? 'Choose a starter to see eligible bench options.'
              : `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} projected points with this change.`}
          </p>
        </section>
      </div>
      <p role="status" className="status-msg">
        {msg}
      </p>
      <div className="note amber">
        This is a planning scenario using the supplied projections. It does not
        change Yahoo, check game locks, or fetch current injury reports.
      </div>
      <section className="panel" style={{ marginTop: 22 }}>
        <div className="panel-table-head">
          <div className="section-top">
            <h2>Your roster</h2>
            <SourceLink data={data} />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
            <TabsList className="filter-tabs">
              <TabsTrigger value="all">All players</TabsTrigger>
              <TabsTrigger value="starters">Starters</TabsTrigger>
              <TabsTrigger value="bench">Bench & IR</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <PlayerTable
          players={roster.filter(
            (p) =>
              tab === 'all' ||
              (tab === 'starters'
                ? !['BN', 'IR'].includes(p.slot)
                : ['BN', 'IR'].includes(p.slot)),
          )}
        />
      </section>
    </>
  );
}
export function Waivers({ data }: { data: Snapshot }) {
  const [query, setQuery] = useState(''),
    [pos, setPos] = useState('ALL'),
    [mode, setMode] = useState('waivers');
  const players = available.filter(
    (p) =>
      (pos === 'ALL' || p.position === pos) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Tabs value={mode} onValueChange={(v) => setMode(String(v))}>
        <TabsList className="filter-tabs">
          <TabsTrigger value="waivers">Available players</TabsTrigger>
          <TabsTrigger value="trades">Trade desk</TabsTrigger>
        </TabsList>
      </Tabs>
      {mode === 'waivers' ? (
        <>
          <div className="two-col" style={{ marginTop: 22 }}>
            <section className="panel panel-pad">
              <span className="eyebrow">Your claim position</span>
              <div className="big-value">
                #{data.waiverPriority}
                <small>of 10 managers</small>
              </div>
              <p className="small">
                Continual rolling priority · 2-day waivers
              </p>
            </section>
            <section className="panel panel-pad">
              <h2>Build the shortlist</h2>
              <p
                className="muted"
                style={{ marginTop: 12, fontSize: '.875rem' }}
              >
                50 players across two supplied pages. Week 1 projections and
                fresh player news are needed before ranking claims or
                recommending drops.
              </p>
              <span className="pill amber" style={{ marginTop: 15 }}>
                Historical period unconfirmed
              </span>
            </section>
          </div>
          <div className="toolbar">
            <input
              className="search"
              aria-label="Search available players"
              placeholder="Search available players…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Tabs value={pos} onValueChange={(v) => setPos(String(v))}>
              <TabsList className="filter-tabs">
                {['ALL', 'QB', 'RB', 'WR', 'TE'].map((p) => (
                  <TabsTrigger key={p} value={p}>
                    {p === 'ALL' ? 'All' : p}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <section className="panel">
            <div className="panel-table-head section-top">
              <h2>{players.length} available players</h2>
              <span className="small">Snapshot · W (Sep 8)</span>
            </div>
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Bye</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="num">Multi-game points*</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell>
                      <div className="player-cell">
                        <span className="team-chip">{p.team}</span>
                        <span className="player-name">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="position">{p.position}</span>
                    </TableCell>
                    <TableCell>{p.bye}</TableCell>
                    <TableCell>
                      {p.status ? (
                        <span className="pill amber">{p.status}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="num">
                      {p.reported_fantasy_points.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!players.length && (
              <div className="empty-state">
                No players match. Try another name or position.
              </div>
            )}
            <p className="small" style={{ padding: 22 }}>
              *Stats period was not visible in the pasted lists. These are not
              Week 1 projections. Availability has not been refreshed.
            </p>
          </section>
        </>
      ) : (
        <div className="two-col" style={{ marginTop: 22 }}>
          <section className="panel panel-pad">
            <h2>Find a trade that fits both teams</h2>
            <p className="muted" style={{ marginTop: 16 }}>
              Add other managers’ rosters to your next update. The analyst can
              then compare positional needs and suggest a concrete offer with
              your corresponding lineup changes.
            </p>
            <div className="note" style={{ marginTop: 20 }}>
              No trade recommendations yet. Your league’s other rosters have not
              been supplied.
            </div>
            <div style={{ marginTop: 20 }}>
              <SourceLink data={data} />
            </div>
          </section>
          <section className="panel panel-pad">
            <h2>League trade rules</h2>
            {[
              'Deadline · November 28, 2026',
              'Review · Commissioner',
              'Rejection period · 1 day',
              'Season trade limit · No maximum',
              'Draft-pick trades · Not allowed',
            ].map((t) => (
              <div className="deadline" key={t}>
                <ArrowLeftRight />
                <p>{t}</p>
              </div>
            ))}
          </section>
        </div>
      )}
    </>
  );
}
export function Survivor({
  data,
  draft,
  onDraft,
  now,
}: {
  data: Snapshot;
  draft: string;
  onDraft: (v: string) => void;
  now: number;
}) {
  const locked = now >= new Date(data.survivor.deadline).getTime();
  return (
    <>
      <div className="two-col">
        <section className="panel panel-pad matchup">
          <div className="panel-head">
            <h2>Stay in the game</h2>
            <span
              className={`pill ${data.survivor.eliminated ? 'red' : 'green'}`}
            >
              {data.survivor.eliminated ? 'Eliminated' : 'Active in snapshot'}
            </span>
          </div>
          <div className="big-value">
            <ShieldCheck size={34} />
            {data.survivor.pick}
            <small>Imported selection</small>
          </div>
          <p className="small">
            {data.survivor.strikes} strikes · One strike eliminates · Playoffs
            included
          </p>
          <div className="card-bottom">
            <SourceLink data={data} index={1} />
            <span className="pill amber">
              {locked ? 'Deadline passed' : 'Weekly lock'}
            </span>
          </div>
        </section>
        <section className="panel panel-pad">
          <h2>One deadline for the whole week</h2>
          <div className="deadline">
            <Clock />
            <div>
              <p>{pacific(data.survivor.deadline)}</p>
              <small>Five minutes before the week’s first game</small>
            </div>
          </div>
          <p className="small" style={{ marginTop: 18 }}>
            A Sunday selection still locks before the first kickoff of the week.
            Confirm your pick in Yahoo.
          </p>
          <div className="note" style={{ marginTop: 18 }}>
            Team-reuse and playoff reset rules need confirmation. The planner
            flags previously used teams without assuming eligibility.
          </div>
        </section>
      </div>
      <section className="panel panel-pad" style={{ margin: '22px 0' }}>
        <div className="section-top">
          <h2>Your season path</h2>
          <span className="small">Week {data.week} · snapshot</span>
        </div>
        <div className="history-strip">
          {Array.from({ length: 18 }, (_, i) => (
            <div
              key={i}
              className={`week-cell ${i + 1 === data.week ? 'selected' : ''}`}
            >
              WK {i + 1}
              <b>{i + 1 === data.week ? data.survivor.pick : '—'}</b>
            </div>
          ))}
        </div>
        <p className="small">
          Used teams:{' '}
          {data.survivor.usedTeams.length
            ? data.survivor.usedTeams.join(', ')
            : 'None recorded'}
          . Earlier results appear when supplied in a weekly update.
        </p>
      </section>
      <div className="section-top">
        <h2>Explore this week’s options</h2>
        <span className="pill">Local scenario: {draft || 'none'}</span>
      </div>
      <div className="note" style={{ marginBottom: 20 }}>
        Contest spreads below are context, not win probabilities or survivor
        recommendations. Fresh odds, injuries, pool size, and future schedules
        are needed for a researched ranking.
      </div>
      <div className="game-grid">
        {data.games.map((g) => (
          <section className="panel game" key={g.home}>
            <span className="small">{pacific(g.kickoff)}</span>
            <div className="game-teams">
              {g.away}
              <span>AT</span>
              {g.home}
            </div>
            <p className="small">
              Screenshot favorite: {g.favorite} −{g.spread}
            </p>
            <div className="game-picks">
              {[g.away, g.home].map((t) => (
                <button
                  key={t}
                  disabled={locked}
                  className={`btn ${draft === t ? 'active' : ''}`}
                  onClick={() => onDraft(t)}
                >
                  {draft === t && <Check size={14} />} {t}
                  {(data.survivor.usedTeams as string[]).includes(t)
                    ? ' · used'
                    : ''}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
export function Pickem({
  data,
  drafts,
  onDraft,
  now,
}: {
  data: Snapshot;
  drafts: Record<string, string>;
  onDraft: (home: string, pick: string) => void;
  now: number;
}) {
  return (
    <>
      <div className="note amber">
        {data.pickemConfirmed
          ? 'Selections confirmed in the imported weekly file.'
          : 'Review needed: one supplied screenshot was complete and another was empty. Displayed selections come from the completed screenshot.'}{' '}
        Local scenarios do not submit picks to Yahoo.
      </div>
      <div className="section-top" style={{ marginTop: 24 }}>
        <div>
          <h2>Play the spread</h2>
          <p className="small">
            No confidence points · All weeks count · No playoffs
          </p>
        </div>
        <SourceLink data={data} index={2} />
      </div>
      <div className="game-grid">
        {data.games.map((g) => {
          const lock = lockTime(g.kickoff),
            locked = now >= new Date(lock).getTime();
          return (
            <section className="panel game" key={g.home}>
              <div className="panel-head">
                <span className="small">{pacific(g.kickoff)}</span>
                <span className={`pill ${locked ? 'amber' : ''}`}>
                  {locked ? 'Locked' : 'Upcoming'}
                </span>
              </div>
              <div className="game-teams">
                {g.away}
                <span>AT</span>
                {g.home}
              </div>
              <p className="small">
                Yahoo line: {g.favorite} −{g.spread}
              </p>
              <div className="card-bottom">
                <span className="small">Imported pick</span>
                <b>{g.pick || 'Not entered'}</b>
              </div>
              <div className="game-picks">
                {[g.away, g.home].map((t) => (
                  <button
                    key={t}
                    className={`btn ${drafts[g.home] === t ? 'active' : ''}`}
                    disabled={locked}
                    onClick={() => onDraft(g.home, t)}
                  >
                    {drafts[g.home] === t && <Check size={14} />} {t}{' '}
                    {g.favorite === t ? `−${g.spread}` : `+${g.spread}`}
                  </button>
                ))}
              </div>
              <p className="small" style={{ marginTop: 12 }}>
                {drafts[g.home]
                  ? `Local scenario: ${drafts[g.home]}`
                  : 'Choose a local scenario'}{' '}
                · Locks 5 min before kickoff
              </p>
            </section>
          );
        })}
      </div>
      <section className="panel panel-pad" style={{ marginTop: 22 }}>
        <h2>Tiebreakers need a separate check</h2>
        <p className="muted" style={{ marginTop: 12 }}>
          The completed Week 1 screenshot shows Denver 17–Kansas City 14 and
          Dallas 24–NY Giants 21; Chargers most points and Cleveland fewest.
          These are screenshot entries, not recommendations. Confirm current
          values and the separate tiebreaker deadlines in Yahoo.
        </p>
      </section>
    </>
  );
}
export function Analyst({ data }: { data: Snapshot }) {
  const [question, setQuestion] = useState(''),
    [lastQuestion, setLastQuestion] = useState(''),
    [messages, setMessages] = useState([
      {
        role: 'assistant',
        text: 'Your playbook is ready. Ask about your roster, scoring, waiver rules or pick deadlines. I answer from the saved snapshot; fresh research needs an external assistant session.',
      },
    ]),
    [copyMsg, setCopyMsg] = useState(''),
    [prompt, setPrompt] = useState('');
  function ask(q: string) {
    if (!q.trim()) return;
    setMessages((m) => [
      ...m,
      { role: 'user', text: q },
      { role: 'assistant', text: answerQuestion(q, data) },
    ]);
    setLastQuestion(q);
    setQuestion('');
  }
  async function copy() {
    const text = `Research my fantasy football question using current reliable sources with dates and links. Separate confirmed facts from projections. My league is 10-team half-PPR, 4-point passing TD, -1 INT, rolling waiver priority ${data.waiverPriority}. Survivor: one strike, first-game weekly lock. Pick’em: against the spread, no confidence points. Snapshot date: ${data.updatedAt}. Week ${data.week}, ${data.season}.\nQuestion: ${question || lastQuestion || 'Review my lineup and weekly decisions.'}\nRoster and current picks:\n${JSON.stringify(data, null, 2)}`;
    setPrompt(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(
        'Research prompt copied. Paste it into your external assistant.',
      );
    } catch {
      setCopyMsg('Select and copy the research prompt below.');
    }
  }
  return (
    <div className="body-grid" style={{ marginTop: 0 }}>
      <div>
        <section className="panel briefing">
          <div className="panel-pad">
            <div className="briefing-title">
              <Sparkles className="spark" size={42} />
              <div>
                <h2>Your personal analyst</h2>
                <p className="small">
                  Saved-report assistant · No live web connection
                </p>
              </div>
            </div>
          </div>
          <div className="chat-log" role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div
                className={`chat-bubble ${m.role === 'user' ? 'user' : ''}`}
                key={i}
              >
                {m.text}
              </div>
            ))}
          </div>
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            <input
              className="search"
              aria-label="Ask your analyst"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about your week…"
              maxLength={1000}
            />
            <button
              className="btn primary"
              disabled={!question.trim()}
              aria-label="Send question"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
        <div className="prompt-grid">
          {[
            'Who should I start?',
            'Explain my survivor deadline',
            'What are my waiver rules?',
            'Compare McMillan and Love',
          ].map((q) => (
            <button className="btn" key={q} onClick={() => ask(q)}>
              {q}
            </button>
          ))}
        </div>
        <button className="btn" onClick={copy}>
          <Copy />
          Copy research prompt
        </button>
        <p className="status-msg" role="status">
          {copyMsg}
        </p>
        {prompt && (
          <textarea
            className="search"
            style={{ width: '100%', minHeight: 180 }}
            aria-label="Research prompt"
            readOnly
            value={prompt}
          />
        )}
      </div>
      <section className="panel panel-pad" style={{ alignSelf: 'start' }}>
        <h2>What this answer knows</h2>
        <div className="sources">
          {data.sources.map((s) => (
            <div className="source-item" key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}{' '}
                <ExternalLink size={13} style={{ display: 'inline' }} />
              </a>
              <p>Supplied snapshot · {data.updatedAt}</p>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 20 }}>
          Fresh news, injury verification, waiver rankings, and trade proposals
          have not been researched for this report. The assistant will tell you
          when the saved data is insufficient.
        </div>
      </section>
    </div>
  );
}
export function Updates({
  data,
  archives,
  onImport,
  onSelect,
  onReset,
}: {
  data: Snapshot;
  archives: Snapshot[];
  onImport: (f: File) => Promise<void>;
  onSelect: (s: Snapshot) => void;
  onReset: () => void;
}) {
  const [msg, setMsg] = useState('');
  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      }),
      url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `football-${data.season}-week-${data.week}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="two-col">
        <section className="panel panel-pad">
          <h2>Refresh your weekly playbook</h2>
          <p className="muted" style={{ marginTop: 14 }}>
            Add Yahoo screenshots to your local project folder, then request a
            weekly update. The update session turns them into a checked weekly
            file and adds researched recommendations when available.
          </p>
          <div className="upload-zone">
            <h3>Import a prepared weekly file</h3>
            <p className="small" style={{ marginTop: 8 }}>
              Choose the JSON file from your update session. Importing updates
              this browser only; it does not publish or change Yahoo.
            </p>
            <input
              type="file"
              accept=".json,application/json"
              aria-label="Import weekly JSON file"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  await onImport(f);
                  setMsg('Weekly file imported and archived in this browser.');
                } catch (error) {
                  setMsg((error as Error).message);
                }
                e.target.value = '';
              }}
            />
          </div>
          <div className="toolbar">
            <button className="btn" onClick={download}>
              <Download />
              Export snapshot
            </button>
            <button
              className="btn"
              onClick={() => {
                onReset();
                setMsg(
                  'Restored the original Week 1 snapshot. Imported archives remain available.',
                );
              }}
            >
              Restore original
            </button>
          </div>
          <p className="status-msg" role="status">
            {msg}
          </p>
        </section>
        <section className="panel panel-pad">
          <h2>Next update checklist</h2>
          {[
            'Your full roster and this week’s matchup',
            'Available players with weekly projections',
            'Survivor entry, used teams and standings',
            'Pick’em selections, contest lines and tiebreakers',
            'Other managers’ rosters for trade analysis',
          ].map((t, i) => (
            <div className="action-row" key={t}>
              <span className="action-num">{i + 1}</span>
              <p style={{ fontSize: '.875rem' }}>{t}</p>
            </div>
          ))}
          <p className="small" style={{ marginTop: 18 }}>
            Keep settings screenshots local; some contain group passwords.
          </p>
        </section>
      </div>
      <section className="panel panel-pad" style={{ marginTop: 22 }}>
        <h2>Weekly archive</h2>
        {archives.map((s) => (
          <div className="archive-row" key={`${s.season}-${s.week}`}>
            <div>
              <h3>
                {s.season} · Week {s.week}
              </h3>
              <p className="small">
                Snapshot {s.updatedAt} · {s.teamName}
              </p>
            </div>
            <button className="btn" onClick={() => onSelect(s)}>
              {s.week === data.week && s.season === data.season
                ? 'Current week'
                : 'Open week'}
            </button>
          </div>
        ))}
        <p className="small" style={{ marginTop: 18 }}>
          Archives and pick scenarios are local to this browser. Export a copy
          before clearing browser storage.
        </p>
      </section>
    </>
  );
}
