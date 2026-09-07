import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(
  new URL('../lib/football.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const {
  total,
  swapRoster,
  optimize,
  validateSnapshot,
  lockTime,
  answerQuestion,
} = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);
const data = JSON.parse(
  readFileSync(
    new URL('../lib/data/weekly-snapshot.json', import.meta.url),
    'utf8',
  ),
);
test('snapshot matches Yahoo starting total and survives import/export', () => {
  assert.equal(total(data.roster), 107.95);
  assert.deepEqual(validateSnapshot(data), data);
});
test('legal FLEX swap changes only slots and projection total', () => {
  const next = swapRoster(data.roster, 'Tetairoa McMillan', 'Jeremiyah Love');
  assert.equal(total(next), 107.9);
  assert.equal(next.find((p) => p.name === 'Jeremiyah Love').slot, 'FLEX');
  assert.equal(data.roster.find((p) => p.name === 'Jeremiyah Love').slot, 'BN');
});
test('ineligible bench player cannot replace quarterback', () =>
  assert.throws(() =>
    swapRoster(data.roster, 'Brock Purdy', 'Jameson Williams'),
  ));
test('optimizer fills nine legal slots and excludes an out player', () => {
  const changed = structuredClone(data.roster);
  changed.find((p) => p.name === 'Ja’Marr Chase').status = 'O';
  const next = optimize(changed);
  assert.equal(next.find((p) => p.name === 'Ja’Marr Chase').slot, 'BN');
  assert.equal(next.filter((p) => !['BN', 'IR'].includes(p.slot)).length, 9);
  validateSnapshot({ ...data, roster: next });
  assert.ok(total(optimize(data.roster)) >= total(data.roster));
});
test('import rejects illegal slots and invalid projections', () => {
  const bad = structuredClone(data);
  bad.roster[0].slot = 'WR';
  assert.throws(() => validateSnapshot(bad));
  bad.roster[0].slot = 'QB';
  bad.roster[0].projection = '17.96';
  assert.throws(() => validateSnapshot(bad));
});
test('import strips extra fields and rejects unsafe source URLs', () => {
  assert.equal(
    validateSnapshot({ ...data, password: 'do-not-publish' }).password,
    undefined,
  );
  const bad = structuredClone(data);
  bad.sources[0].url = 'javascript:alert(1)';
  assert.throws(() => validateSnapshot(bad));
});
test('pickem lock is five minutes before kickoff; survivor has a single earlier lock', () => {
  assert.equal(lockTime(data.games[0].kickoff), '2026-09-10T00:15:00.000Z');
  assert.ok(
    Date.parse(data.survivor.deadline) <
      Date.parse(lockTime(data.games[8].kickoff)),
  );
});
test('assistant labels missing live information and compares both named players', () => {
  assert.match(
    answerQuestion('What is the weather?', data),
    /beyond this saved report/,
  );
  const answer = answerQuestion('Compare McMillan and Love', data);
  assert.match(answer, /Tetairoa McMillan/);
  assert.match(answer, /Jeremiyah Love/);
});
