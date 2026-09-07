import { cp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist/client'),
  out = path.resolve('out');
if (!existsSync(path.join(root, 'index.html')))
  throw new Error('Static export is missing index.html.');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'index.rsc', 'favicon.svg']) {
  if (existsSync(path.join(root, name)))
    await cp(path.join(root, name), path.join(out, name));
}
// vinext emits path-prefixed asset directories. GitHub mounts out/ at /football/.
await cp(path.join(root, 'football', '_next'), path.join(out, '_next'), {
  recursive: true,
});
await writeFile(path.join(out, '.nojekyll'), '');
await writeFile(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
const html = await readFile(path.join(out, 'index.html'), 'utf8');
for (const [, url] of html.matchAll(/(?:src|href)="(\/football\/[^"?#]+)"/g)) {
  if (!existsSync(path.join(out, url.slice('/football/'.length))))
    throw new Error(`Missing static asset: ${url}`);
}
async function check(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) await check(file);
    else if (/\.(png|jpe?g|env)$/i.test(item.name))
      throw new Error(`Unexpected private input or image: ${file}`);
  }
}
await check(out);
console.log(
  'GitHub Pages output ready: out/ (HTML and referenced assets verified).',
);
