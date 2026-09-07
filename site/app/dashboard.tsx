'use client';
import { useState, useEffect } from 'react';
import {
  Lineup,
  Waivers,
  Survivor,
  Pickem,
  Analyst,
  Updates,
  PlayerTable,
} from './views';
import {
  type Snapshot,
  validateSnapshot,
  total,
  pacific,
  swapRoster,
} from '@/lib/football';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  ListChecks,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Trophy,
  CalendarDays,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import snapshot from '@/lib/data/weekly-snapshot.json';
const nav = [
  { id: 'overview', label: 'This week', icon: LayoutDashboard },
  { id: 'lineup', label: 'Lineup lab', icon: Users },
  { id: 'waivers', label: 'Waivers & trades', icon: ArrowLeftRight },
  { id: 'survivor', label: 'Survivor', icon: ShieldCheck },
  { id: 'pickem', label: 'Pick’em', icon: ListChecks },
  { id: 'analyst', label: 'Ask the analyst', icon: Sparkles },
  { id: 'updates', label: 'Updates & history', icon: RefreshCw },
];
function Navigation({
  view,
  onChange,
}: {
  view: string;
  onChange: (v: string) => void;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar>
      <SidebarHeader className="brand">
        <div className="brand-mark">
          <Trophy size={21} />
        </div>
        <div>
          <b>METLIFE CRISIS</b>
          <small>FANTASY COMMAND CENTER</small>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="nav-label">YOUR PLAYBOOK</div>
        <SidebarMenu className="nav-menu">
          {nav.map((n) => (
            <SidebarMenuItem key={n.id}>
              <SidebarMenuButton
                className="nav-button"
                isActive={view === n.id}
                onClick={() => {
                  onChange(n.id);
                  setOpenMobile(false);
                }}
              >
                <n.icon />
                <span>{n.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="side-foot">
        <div className="pill green">
          <span className="dot" />
          2026 SEASON
        </div>
        <p style={{ margin: '15px 0 24px' }}>
          Big Blue energy.
          <br />
          Fewer Sunday regrets.
        </p>
        <div className="profile">
          <div className="avatar">M</div>
          <div>
            <b>Martin</b>
            <br />
            <span>Personal workspace</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
const titles: Record<string, [string, string]> = {
  overview: [
    'Your week. Your edge.',
    'A little less crisis. A little more game plan.',
  ],
  lineup: [
    'Lineup lab',
    'Big decisions. Preferably before the opening whistle.',
  ],
  waivers: ['Waivers & trades', 'A little roster therapy. No waiting room.'],
  survivor: [
    'Survivor',
    'Survive and advance. Leave the crisis to the stadium.',
  ],
  pickem: ['Pick’em', 'Read between the lines. Especially the point spreads.'],
  analyst: ['Ask the analyst', 'Your playbook, explained.'],
  updates: ['Updates & history', 'Fresh screenshots. Clearer Sundays.'],
};
const storageKey = 'metlife-crisis-v1';
export default function Home() {
  const [view, setView] = useState('overview'),
    [data, setData] = useState<Snapshot>(snapshot),
    [archives, setArchives] = useState<Snapshot[]>([snapshot]),
    [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({}),
    [survivorDrafts, setSurvivorDrafts] = useState<Record<string, string>>({}),
    [ready, setReady] = useState(false),
    [now, setNow] = useState(0),
    [storageMsg, setStorageMsg] = useState('');
  const weekKey = `${data.season}-${data.week}`;
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const x = JSON.parse(saved);
        const checked = validateSnapshot(x.data);
        setData(checked);
        setArchives(x.archives.map(validateSnapshot));
        if (x.drafts && typeof x.drafts === 'object') setDrafts(x.drafts);
        if (x.survivorDrafts && typeof x.survivorDrafts === 'object')
          setSurvivorDrafts(x.survivorDrafts);
      }
    } catch {
      setStorageMsg(
        'Saved browser data could not be loaded. Showing the original snapshot.',
      );
    }
    setReady(true);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ data, archives, drafts, survivorDrafts }),
      );
    } catch {
      setStorageMsg(
        'Browser storage is unavailable. Export your snapshot to keep a copy.',
      );
    }
  }, [data, archives, drafts, survivorDrafts, ready]);
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: unknown,
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'read_fantasy_week',
            description:
              'Read the currently displayed imported fantasy snapshot. Does not fetch live data.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: () => ({
              week: data.week,
              season: data.season,
              updatedAt: data.updatedAt,
              roster: data.roster,
              survivor: data.survivor,
              games: data.games,
            }),
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
      Promise.resolve(
        context.registerTool(
          {
            name: 'compare_lineup_swap',
            description:
              'Calculate a legal starter/bench swap against imported projections without changing the lineup.',
            inputSchema: {
              type: 'object',
              properties: {
                starter: { type: 'string' },
                bench: { type: 'string' },
              },
              required: ['starter', 'bench'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute: (input: unknown) => {
              const x = input as { starter?: string; bench?: string };
              if (
                !x ||
                typeof x.starter !== 'string' ||
                typeof x.bench !== 'string'
              )
                throw new Error('Starter and bench names are required.');
              const changed = swapRoster(data.roster, x.starter, x.bench);
              return {
                before: total(data.roster),
                after: total(changed),
                delta:
                  Math.round((total(changed) - total(data.roster)) * 100) / 100,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [data]);
  async function importWeek(file: File) {
    if (file.size > 1000000)
      throw new Error('Weekly files must be smaller than 1 MB.');
    const next = validateSnapshot(JSON.parse(await file.text()));
    setData(next);
    setArchives((a) =>
      [
        ...a.filter((s) => s.season !== next.season || s.week !== next.week),
        next,
      ].sort((a, b) => a.season - b.season || a.week - b.week),
    );
  }
  return (
    <SidebarProvider>
      <Navigation view={view} onChange={setView} />
      <div className="workspace">
        <header className="topbar">
          <div className="top-left">
            <SidebarTrigger className="mobile-toggle" />
            <span className="eyebrow">Fantasy football / {data.season}</span>
          </div>
          <div className="top-actions">
            <span className="freshness">Snapshot · {data.updatedAt}</span>
            <button
              className="pill"
              onClick={() => setView('updates')}
              aria-label="Choose an archived week"
            >
              WEEK {String(data.week).padStart(2, '0')}
            </button>
            <div className="avatar">M</div>
          </div>
        </header>
        <main className="content">
          <div className="heading">
            <div>
              <h1>{titles[view][0]}</h1>
              <p>{titles[view][1]}</p>
            </div>
            <button className="btn primary" onClick={() => setView('updates')}>
              <RefreshCw />
              <span>Update my week</span>
            </button>
          </div>
          {storageMsg && (
            <div className="note amber" role="status">
              {storageMsg}
            </div>
          )}
          {now > 0 &&
            now - new Date(data.updatedAt).getTime() > 3 * 86400000 && (
              <div className="note amber" style={{ marginBottom: 20 }}>
                This snapshot is more than three days old. Refresh it before
                relying on injury tags, availability or picks.
              </div>
            )}
          {view === 'overview' && <Overview data={data} setView={setView} />}
          {view === 'lineup' && (
            <Lineup key={weekKey + data.updatedAt} data={data} />
          )}
          {view === 'waivers' && <Waivers data={data} />}
          {view === 'survivor' && (
            <Survivor
              data={data}
              draft={survivorDrafts[weekKey] || ''}
              onDraft={(v) =>
                setSurvivorDrafts((d) => ({ ...d, [weekKey]: v }))
              }
              now={now}
            />
          )}
          {view === 'pickem' && (
            <Pickem
              data={data}
              drafts={drafts[weekKey] || {}}
              onDraft={(home, pick) =>
                setDrafts((d) => ({
                  ...d,
                  [weekKey]: { ...d[weekKey], [home]: pick },
                }))
              }
              now={now}
            />
          )}
          {view === 'analyst' && (
            <Analyst key={weekKey + data.updatedAt} data={data} />
          )}
          {view === 'updates' && (
            <Updates
              data={data}
              archives={archives}
              onImport={importWeek}
              onSelect={setData}
              onReset={() => setData(snapshot)}
            />
          )}
          <footer className="page-foot">
            <span>METLIFE CRISIS / PERSONAL PLAYBOOK</span>
            <span>
              Snapshot {data.updatedAt} · Times Pacific · No live feed
            </span>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}
function Overview({
  data,
  setView,
}: {
  data: Snapshot;
  setView: (view: string) => void;
}) {
  return (
    <>
      <div className="cards">
        <section className="panel panel-pad matchup">
          <div className="panel-head">
            <span className="eyebrow">Family league · Week {data.week}</span>
            <span className="pill">HALF-PPR</span>
          </div>
          <div className="scoreline">
            <div className="score-team">
              <div className="team-monogram">MB</div>
              <p>{data.teamName}</p>
              <div className="score">{total(data.roster).toFixed(2)}</div>
              <span className="score-caption">Projected points</span>
            </div>
            <span className="muted">vs</span>
            <div className="score-team right">
              <div className="team-monogram">HN</div>
              <p>{data.opponent}</p>
              <div className="score">{data.opponentProjection.toFixed(2)}</div>
              <span className="score-caption">Projected points</span>
            </div>
          </div>
          <div className="match-bar">
            <span
              style={{
                width: `${(total(data.roster) / (total(data.roster) + data.opponentProjection)) * 100}%`,
              }}
            />
            <span />
          </div>
          <div className="small">
            {Math.abs(data.opponentProjection - total(data.roster)).toFixed(2)}
            -point projected difference · Screenshot projections
          </div>
        </section>
        <section className="panel panel-pad">
          <div className="panel-head">
            <span className="eyebrow">Survivor</span>
            <ShieldCheck size={20} className="green-text" />
          </div>
          <div className="big-value">
            {data.survivor.pick}{' '}
            <span className="pill green">
              {data.survivor.eliminated ? 'Eliminated' : 'Active snapshot'}
            </span>
          </div>
          <p className="small">
            Your Week {data.week} selection
            <br />
            Metlife Crisis · FourthandLong
          </p>
          <div className="card-bottom">
            <span className="small">
              {data.survivor.strikes} strikes · 1 eliminates
            </span>
            <button className="link" onClick={() => setView('survivor')}>
              View pick <ChevronRight size={15} />
            </button>
          </div>
        </section>
        <section className="panel panel-pad">
          <div className="panel-head">
            <span className="eyebrow">Pick’em</span>
            <ListChecks size={20} className="muted" />
          </div>
          <div className="big-value">
            {data.games.filter((g) => g.pick).length}{' '}
            <small>/ {data.games.length} picks</small>
          </div>
          <p className="small">
            Against the spread
            <br />
            Completed screenshot imported
          </p>
          <div className="card-bottom">
            <span className="pill amber">
              {data.pickemConfirmed
                ? 'Snapshot confirmed'
                : 'Confirm saved picks'}
            </span>
            <button className="link" onClick={() => setView('pickem')}>
              <ChevronRight size={18} />
              <span className="visually-hidden">View pick’em</span>
            </button>
          </div>
        </section>
      </div>
      <div className="body-grid">
        <section className="panel panel-pad briefing">
          <div className="panel-head">
            <div className="briefing-title">
              <Sparkles className="spark" size={39} />
              <div>
                <h2>Your weekly briefing</h2>
                <p className="small">Three things to review before kickoff</p>
              </div>
            </div>
            <span className="pill">Snapshot analysis</span>
          </div>
          {[
            [
              data.roster.some((p) => p.status)
                ? 'Check your injury watchlist'
                : 'Recheck availability before kickoff',
              `${data.roster.filter((p) => p.status).length} players carry a status tag in your snapshot. Verify official game status before making lineup decisions.`,
            ],
            [
              'Let the numbers earn their roster spot',
              `Your starting lineup projects ${total(data.roster).toFixed(2)} points. Explore legal swaps in the Lineup Lab; fresh news can change the decision.`,
            ],
            [
              'Survive the deadline first',
              `Your entire survivor week locks ${pacific(data.survivor.deadline)}. Sunday picks still lock before the week’s first game.`,
            ],
          ].map(([t, d], i) => (
            <div className="action-row" key={t}>
              <div className="action-num">0{i + 1}</div>
              <div className="action-copy">
                <h3>{t}</h3>
                <p>{d}</p>
                <button
                  className="link"
                  onClick={() => setView(i === 2 ? 'survivor' : 'lineup')}
                >
                  Review decision <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </section>
        <section className="panel panel-pad">
          <h2>On the clock</h2>
          <div className="deadline">
            <Clock />
            <div>
              <p>Survivor locks</p>
              <small>{pacific(data.survivor.deadline)}</small>
            </div>
          </div>
          <div className="deadline">
            <CalendarDays />
            <div>
              <p>First pick’em game locks</p>
              <small>
                {data.games.length
                  ? pacific(
                      new Date(
                        new Date(data.games[0].kickoff).getTime() - 300000,
                      ).toISOString(),
                    )
                  : 'Schedule needed'}
              </small>
            </div>
          </div>
          <div className="deadline">
            <RefreshCw />
            <div>
              <p>Waiver list availability</p>
              <small>All 50 players show Sep 8 waivers</small>
            </div>
          </div>
          <div className="note" style={{ marginTop: 20 }}>
            Based on your Yahoo snapshots. Fresh news research has not been
            added yet.
          </div>
        </section>
      </div>
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="panel-table-head section-top">
          <div>
            <h2>The starting nine</h2>
            <p className="small">Big Blue hopes. Half-PPR math.</p>
          </div>
          <button className="link" onClick={() => setView('lineup')}>
            Open lineup lab <ChevronRight size={16} />
          </button>
        </div>
        <PlayerTable
          players={data.roster.filter((p) => !['BN', 'IR'].includes(p.slot))}
        />
      </section>
    </>
  );
}
