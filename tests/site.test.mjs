import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {cpSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
let buildRoot;

const read = (path) => readFileSync(join(buildRoot, path), 'utf8');
const readProject = (path) => readFileSync(join(PROJECT_ROOT, path), 'utf8');

before(() => {
  buildRoot = mkdtempSync(join(tmpdir(), 'kubotal-build-'));
  cpSync(join(PROJECT_ROOT, 'build.mjs'), join(buildRoot, 'build.mjs'));
  cpSync(join(PROJECT_ROOT, 'src'), join(buildRoot, 'src'), {recursive: true});
  cpSync(join(PROJECT_ROOT, 'assets'), join(buildRoot, 'assets'), {recursive: true});

  const result = spawnSync(process.execPath, ['build.mjs'], {
    cwd: buildRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

after(() => {
  if (buildRoot) rmSync(buildRoot, {recursive: true, force: true});
});

test('builds one landing page with local anchors and keeps articles separate', () => {
  const home = read('index.html');
  const ids = [...home.matchAll(/id="(accueil|expertise|open-source|accompagnement|contact)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(ids, ['accueil', 'expertise', 'open-source', 'accompagnement', 'contact']);
  assert.match(home, /href="#expertise"/);
  assert.match(home, /href="#open-source"/);
  assert.match(home, /href="#accompagnement"/);
  assert.match(home, /href="#contact"/);
  assert.match(home, /href="\/articles\/"/);
  assert.equal((home.match(/<h1\b/g) || []).length, 1);

  const articles = read('articles/index.html');
  assert.match(articles, /href="\/#expertise"/);
  assert.match(articles, /href="\/#contact"/);
  assert.match(articles, /<h1[^>]*>Notes de terrain\.<\/h1>/);
});

test('redirects legacy commercial routes and removes them from the sitemap', () => {
  for (const [path, target] of [
    ['expertise/index.html', '/#expertise'],
    ['open-source/index.html', '/#open-source'],
    ['accompagnement/index.html', '/#accompagnement'],
    ['contact/index.html', '/#contact'],
  ]) {
    const html = read(path);
    assert.match(html, new RegExp(`location\\.replace\\('${target}'\\)`));
    assert.match(html, new RegExp(`content="0;url=${target}"`));
  }

  const sitemap = read('sitemap.xml');
  assert.doesNotMatch(
    sitemap,
    /<loc>https:\/\/kubotal\.io\/(expertise|open-source|accompagnement|contact)\//,
  );
  assert.match(sitemap, /<loc>https:\/\/kubotal\.io\/articles\//);
});

test('uses one accessible ecosystem illustration and omits unused ScrollTrigger', () => {
  const home = read('index.html');
  const app = read('assets/app.js');

  assert.match(home, /class="iso-stage"[^>]*role="img"[^>]*aria-label=/);
  assert.doesNotMatch(home, /<button[^>]*data-tile/);
  assert.doesNotMatch(home, /ScrollTrigger/);
  assert.doesNotMatch(app, /is-held/);

  assert.equal((home.match(/aria-label="Ouvrir [^"]+ dans un nouvel onglet"/g) || []).length, 3);
});

test('ships progressive section navigation behavior', () => {
  const app = read('assets/app.js');

  assert.match(app, /data-nav-section/);
  assert.match(app, /aria-current', 'location'/);
  assert.match(app, /event\.target\.closest\('a'\)/);
});

test('gives landing sections compact rhythm, anchor offsets and deliberate mobile stats', () => {
  const home = read('index.html');
  const css = read('assets/styles.css');

  assert.equal((home.match(/class="section landing-section"/g) || []).length, 4);
  assert.match(css, /main\[data-page="home"\] > section\{[^}]*scroll-margin-top:/s);
  assert.doesNotMatch(css, /min-height:clamp\(240px,36\.5vh,560px\)/);
  assert.doesNotMatch(css, /min-height:min\(74vh,1040px\)/);
  assert.match(css, /\.card-ico\{[^}]*background:var\(--tint/s);
  assert.match(
    css,
    /@media \(max-width:560px\)[\s\S]*\.stats\{[^}]*grid-template-columns:repeat\(3,/,
  );
});

test('documents and verifies generated output in the deployment workflow', () => {
  const workflow = readProject('.github/workflows/deploy.yml');
  const readme = readProject('README.md');

  assert.match(workflow, /node --test tests\/site\.test\.mjs/);
  assert.match(workflow, /node build\.mjs/);
  assert.match(workflow, /git diff --exit-code/);
  assert.match(readme, /landing page unique/i);
  assert.match(readme, /\/#expertise/);
  assert.doesNotMatch(readme, /Aucun build/);
});

test('keeps the sticky navigation inside the document scroll container', () => {
  const css = read('assets/styles.css');
  assert.match(css, /html\{[^}]*overflow-x:clip/s);
  assert.match(css, /body\{[^}]*overflow-x:clip/s);
});

test('activates clicked sections without invalid GSAP transform origins', () => {
  const app = read('assets/app.js');
  assert.doesNotMatch(app, /svgOrigin:\s*null/);
  assert.match(app, /lien\.addEventListener\('click',[\s\S]*activer\(/);
});

test('gives every landing panel at least one viewport below the navigation', () => {
  const css = read('assets/styles.css');

  assert.match(css, /--nav-offset:75px/);
  assert.match(
    css,
    /main\[data-page="home"\] > section\{[^}]*min-height:calc\(100svh - var\(--nav-offset\)\)[^}]*display:flex[^}]*align-items:center[^}]*flex:none/s,
  );
  assert.doesNotMatch(css, /main\[data-page="home"\] \.hero\{[^}]*min-height:/s);
});

test('uses one anchor offset so sections align directly below the sticky navigation', () => {
  const css = read('assets/styles.css');

  assert.match(css, /scroll-margin-top:var\(--nav-offset\)/);
  assert.doesNotMatch(css, /scroll-padding-top:/);
});
