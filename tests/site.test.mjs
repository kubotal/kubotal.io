import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
let buildRoot;

const read = (path) => readFileSync(join(buildRoot, path), 'utf8');
const readProject = (path) => readFileSync(join(PROJECT_ROOT, path), 'utf8');

const PUBLIC_PAGES = [
  ['index.html', 'https://kubotal.io/'],
  ['expertise/index.html', 'https://kubotal.io/expertise/'],
  ['open-source/index.html', 'https://kubotal.io/open-source/'],
  ['accompagnement/index.html', 'https://kubotal.io/accompagnement/'],
  ['contact/index.html', 'https://kubotal.io/contact/'],
  ['articles/index.html', 'https://kubotal.io/articles/'],
  [
    'articles/kubocd-deployer-sans-maitriser-helm/index.html',
    'https://kubotal.io/articles/kubocd-deployer-sans-maitriser-helm/',
  ],
];

const graphFrom = (html) => {
  const source = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1] || '{}';
  return JSON.parse(source)['@graph'];
};

before(() => {
  buildRoot = mkdtempSync(join(tmpdir(), 'kubotal-build-'));
  cpSync(join(PROJECT_ROOT, 'build.mjs'), join(buildRoot, 'build.mjs'));
  cpSync(join(PROJECT_ROOT, 'src'), join(buildRoot, 'src'), {recursive: true});
  cpSync(join(PROJECT_ROOT, 'assets'), join(buildRoot, 'assets'), {recursive: true});
  for (const file of [
    'CNAME',
    'google58a3511232b3ddeb.html',
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    'kubotal-logo-hero.png',
    'kubotal-logo-mark.png',
    'kubotal-logo-watermark.png',
  ]) {
    cpSync(join(PROJECT_ROOT, file), join(buildRoot, file));
  }
  if (existsSync(join(PROJECT_ROOT, 'pages-artifact.mjs'))) {
    cpSync(join(PROJECT_ROOT, 'pages-artifact.mjs'), join(buildRoot, 'pages-artifact.mjs'));
  }

  for (const path of [
    'articles/page/2/index.html',
    'articles/okdp-distribution-data-kubernetes/index.html',
  ]) {
    const output = join(buildRoot, path);
    mkdirSync(join(output, '..'), {recursive: true});
    writeFileSync(output, 'stale generated output', 'utf8');
  }

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
  assert.match(articles, /href="\/expertise\/"/);
  assert.match(articles, /href="\/contact\/"/);
  assert.match(articles, /<h1[^>]*>Notes de terrain\.<\/h1>/);
});

test('publishes only articles with a body and removes stale draft outputs', () => {
  const index = read('articles/index.html');

  assert.match(index, /kubocd-deployer-sans-maitriser-helm/);
  assert.doesNotMatch(index, /okdp-distribution-data-kubernetes/);
  assert.doesNotMatch(index, /11 articles|page 1 sur 2/);
  assert.equal(existsSync(join(buildRoot, 'articles/page/2/index.html')), false);
  assert.equal(
    existsSync(join(buildRoot, 'articles/okdp-distribution-data-kubernetes/index.html')),
    false,
  );
});

test('builds indexable commercial detail pages and keeps the landing UI', () => {
  const home = read('index.html');

  assert.match(home, /class="iso-stage"/);

  for (const [path, heading] of [
    ['expertise/index.html', 'Expertise Data, Kubernetes, GitOps et MLOps'],
    ['open-source/index.html', 'Écosystème open source pour les plateformes Data'],
    ['accompagnement/index.html', 'Accompagnement de plateformes Data et IA'],
    ['contact/index.html', 'Parler de votre plateforme avec Kubotal'],
  ]) {
    const html = read(path);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, new RegExp(`<h1[^>]*>${heading}`));
    assert.doesNotMatch(html, /name="robots" content="noindex/);
  }
});

test('aligns indexable metadata, sitemap and the JSON-LD graph', () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const [path, canonical] of PUBLIC_PAGES) {
    const html = read(path);
    const graph = graphFrom(html);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];

    assert.ok(title);
    assert.ok(description);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`));
    assert.doesNotMatch(html, /name="robots" content="noindex/);
    assert.ok(Array.isArray(graph));
    assert.ok(graph.some((node) => node['@id'] === 'https://kubotal.io/#organization'));
    assert.ok(graph.some((node) => node['@id'] === 'https://kubotal.io/#website'));
    titles.add(title);
    descriptions.add(description);
  }

  assert.equal(titles.size, PUBLIC_PAGES.length);
  assert.equal(descriptions.size, PUBLIC_PAGES.length);

  const sitemap = read('sitemap.xml');
  assert.equal((sitemap.match(/<loc>/g) || []).length, PUBLIC_PAGES.length);
  for (const [, canonical] of PUBLIC_PAGES) {
    assert.match(sitemap, new RegExp(`<loc>${canonical}<\\/loc>`));
  }
  assert.doesNotMatch(sitemap, /articles\/page\/2|okdp-distribution-data-kubernetes/);
});

test('keeps BlogPosting authorship and dates consistent with visible article metadata', () => {
  const html = read('articles/kubocd-deployer-sans-maitriser-helm/index.html');
  const article = graphFrom(html).find((node) => node['@type'] === 'BlogPosting');

  assert.deepEqual(article.author, {
    '@type': 'Organization',
    name: 'Kubotal',
    url: 'https://kubotal.io/',
  });
  assert.match(html, new RegExp(`<time datetime="${article.datePublished}"`));
  assert.match(html, new RegExp(`<time datetime="${article.dateModified}"`));
  assert.match(html, /Par l'équipe Kubotal/);
});

test('exposes only public canonical pages to search and AI crawlers', () => {
  const robots = readProject('robots.txt');
  const llms = readProject('llms.txt');

  assert.match(robots, /User-agent: OAI-SearchBot[\s\S]*Allow: \//);
  assert.match(robots, /User-agent: GPTBot[\s\S]*Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/kubotal\.io\/sitemap\.xml/);
  for (const [, canonical] of PUBLIC_PAGES) assert.match(llms, new RegExp(canonical));
  assert.doesNotMatch(llms, /articles\/page\/2|okdp-distribution-data-kubernetes/);
});

test('self-hosts and preloads the existing web fonts', () => {
  const home = read('index.html');
  const css = read('assets/styles.css');

  assert.doesNotMatch(css, /@import[^;]+fonts\.googleapis\.com/);
  assert.doesNotMatch(home, /fonts\.(googleapis|gstatic)\.com/);
  assert.match(css, /url\('\/assets\/fonts\/dm-sans-latin\.woff2'\)/);
  assert.match(css, /url\('\/assets\/fonts\/space-grotesk-latin\.woff2'\)/);
  assert.match(home, /rel="preload" href="\/assets\/fonts\/dm-sans-latin\.woff2" as="font" type="font\/woff2" crossorigin/);
  assert.match(home, /rel="preload" href="\/assets\/fonts\/space-grotesk-latin\.woff2" as="font" type="font\/woff2" crossorigin/);
});

test('packages only runtime files in the GitHub Pages artifact', () => {
  const result = spawnSync(process.execPath, ['pages-artifact.mjs'], {
    cwd: buildRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  for (const path of [
    'index.html',
    'expertise/index.html',
    'open-source/index.html',
    'accompagnement/index.html',
    'contact/index.html',
    'articles/index.html',
    'articles/kubocd-deployer-sans-maitriser-helm/index.html',
    'assets/styles.css',
    'assets/app.js',
    'assets/favicon.svg',
    'assets/fonts/dm-sans-latin.woff2',
    'assets/fonts/space-grotesk-latin.woff2',
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    'CNAME',
    'google58a3511232b3ddeb.html',
    'kubotal-logo-hero.png',
    'kubotal-logo-mark.png',
  ]) {
    assert.equal(existsSync(join(buildRoot, '.pages-artifact', path)), true, path);
  }

  for (const path of [
    'src',
    'tests',
    'docs',
    'README.md',
    'build.mjs',
    'pages-artifact.mjs',
    'assets/hero-reference.png',
    'assets/pages-reference.png',
  ]) {
    assert.equal(existsSync(join(buildRoot, '.pages-artifact', path)), false, path);
  }
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

test('places Contact before Articles in every generated navigation', () => {
  for (const path of ['index.html', 'articles/index.html']) {
    const html = read(path);
    const navigation = html.match(/<nav class="nav-links"[\s\S]*?<\/nav>/)?.[0] || '';

    assert.match(
      navigation,
      />Expertise<[^]*>Open source<[^]*>Accompagnement<[^]*>Contact<[^]*>Articles</,
    );
  }
});
