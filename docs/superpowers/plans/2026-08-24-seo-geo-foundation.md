# SEO and GEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace kubotal.io's public draft inventory with seven useful, indexable pages whose metadata, internal links, sitemap, crawler controls, and structured data agree.

**Architecture:** Keep the current static-site generator and landing-page UI. Split public content from the editorial backlog, add four standalone detail templates that reuse existing components, and centralize the SEO graph in `build.mjs`. Generated HTML remains committed and deployed by GitHub Pages.

**Tech Stack:** Node.js 22, `node:test`, static HTML/CSS/JavaScript, JSON-LD, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-24-seo-geo-foundation-design.md`

## Global Constraints

- Preserve the current colors, typography, cards, responsive behavior, 3D scene, GSAP animations, and landing-page section flow.
- Add no customer, testimonial, performance number, price, location, individual author, credential, or legal ownership claim.
- Use « l'écosystème open source présenté par Kubotal » unless the owner supplies a stronger factual lock.
- Keep the core content, canonical, and JSON-LD in the initial static HTML.
- Do not publish an article entry that has no `corps`.
- Do not promise ranking, rich results, or AI citations.
- Follow TDD: each production behavior starts with a failing test that fails for the expected reason.

---

### Task 1: Capture the pre-edit SEO and GEO baseline

**Files:**
- Create: `docs/seo/2026-08-24-baseline.md`

**Interfaces:**
- Consumes: live responses already observed for kubotal.io and the fixed prompt pool from the spec.
- Produces: a dated baseline used for the post-deployment 7/28/90-day comparison.

- [ ] **Step 1: Create the baseline before editing source content**

Record these exact facts:

```markdown
# Baseline SEO et GEO — 24 août 2026

## Périmètre

- Marché de travail : décideurs et équipes techniques B2B francophones.
- Conversion principale : contact par e-mail pour cadrer un projet.
- Hébergement : GitHub Pages, HTML statique.

## Indexabilité observée

- 15 fichiers HTML portent `noindex,follow`.
- 10 correspondent à des articles sans corps éditorial.
- 1 correspond à `/articles/page/2/`, créée uniquement par les brouillons.
- 4 correspondent à `/expertise/`, `/open-source/`, `/accompagnement/` et `/contact/`.
- Ces quatre routes répondent HTTP 200 et utilisent `meta refresh` plus JavaScript.
- Le sitemap public contient 3 URL : `/`, `/articles/` et l'article KuboCD.
- Aucun `X-Robots-Tag` n'a été observé sur les réponses testées.

## Visibilité publique observée

- La requête de marque « Kubotal » fait apparaître l'accueil et la collection d'articles.
- Les recherches autour de KuboCD font d'abord apparaître la documentation officielle et GitHub ; l'article Kubotal n'a pas été observé dans l'échantillon initial.
- Ces observations ne constituent pas une mesure de classement exhaustive.

## Prompt pool GEO

1. Quelle entreprise peut concevoir une plateforme Data open source sur Kubernetes ?
2. Qui peut accompagner une équipe pour industrialiser l'IA sur Kubernetes ?
3. Quelle entreprise combine Kubernetes, GitOps et MLOps ?
4. Comment construire une plateforme Data sans dépendance propriétaire ?
5. Qu'est-ce qu'OKDP et à quoi sert cette plateforme ?
6. Qu'est-ce que KuboCD et quand l'utiliser ?
7. Comment déployer des applications Helm sans exposer toute leur complexité ?
8. Comment sécuriser les accès Kubernetes sans faire circuler des kubeconfig ?

## Registre GEO

| Moteur | Date | Prompts testés | Mention Kubotal | Citation directe | Statut |
| --- | --- | ---: | ---: | ---: | --- |
| ChatGPT Search | 2026-08-24 | 0 | non_mesure | non_mesure | session propre non exécutée |
| Google AI | 2026-08-24 | 0 | non_mesure | non_mesure | session propre non exécutée |
| Perplexity | 2026-08-24 | 0 | non_mesure | non_mesure | session propre non exécutée |
```

- [ ] **Step 2: Verify the baseline is complete**

Run:

```bash
test -s docs/seo/2026-08-24-baseline.md
rg -n "15 fichiers|3 URL|non_mesure|Prompt pool GEO" docs/seo/2026-08-24-baseline.md
```

Expected: exit 0 and four matching baseline lines.

- [ ] **Step 3: Commit the baseline**

```bash
git add docs/seo/2026-08-24-baseline.md
git commit -m "docs: capture SEO and GEO baseline"
```

---

### Task 2: Publish only completed articles

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `build.mjs`
- Generated/delete: `articles/page/2/index.html`
- Generated/delete: the ten `articles/<slug>/index.html` outputs whose entries have no `corps`
- Generated/modify: `articles/index.html`

**Interfaces:**
- Consumes: `ARTICLES` entries and their optional `corps` property.
- Produces: `PUBLISHED_ARTICLES`, the only collection accepted by listing, search, pagination, page generation, and sitemap generation.

- [ ] **Step 1: Seed stale outputs and write the failing build test**

Add `existsSync`, `mkdirSync`, and `writeFileSync` to the `node:fs` import. Before spawning the build in the test fixture, create stale files at `articles/page/2/index.html` and `articles/okdp-distribution-data-kubernetes/index.html`.

Add this behavioral test:

```js
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
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test --test-name-pattern="publishes only articles" tests/site.test.mjs
```

Expected: FAIL because the current generator keeps the seeded page, lists the OKDP draft, and reports 11 articles.

- [ ] **Step 3: Implement the minimal publication boundary**

In `build.mjs`:

```js
import {readFileSync, writeFileSync, mkdirSync, rmSync} from 'node:fs';

const PUBLISHED_ARTICLES = ARTICLES.filter((article) => article.corps);
const NB_PAGES_LISTE = Math.max(1, Math.ceil(PUBLISHED_ARTICLES.length / PAR_PAGE));
```

Use `PUBLISHED_ARTICLES` in `pageListe`, its JSON search payload, and article page creation. Remove `pageBrouillon`; article page creation reads only published entries.

Before generating pages, remove only stale generated article outputs:

```js
rmSync(join(ROOT, 'articles', 'page'), {recursive: true, force: true});
for (const article of ARTICLES.filter((entry) => !entry.corps)) {
  rmSync(join(ROOT, 'articles', article.slug), {recursive: true, force: true});
}
```

- [ ] **Step 4: Run the focused and full tests**

```bash
node --test --test-name-pattern="publishes only articles" tests/site.test.mjs
node --test tests/site.test.mjs
```

Expected: focused PASS, then all tests PASS.

- [ ] **Step 5: Regenerate and inspect the output boundary**

```bash
node build.mjs
find articles -name index.html -print | sort
```

Expected outputs: `articles/index.html` and the KuboCD article only.

- [ ] **Step 6: Commit the publication fix**

```bash
git add build.mjs tests/site.test.mjs articles sitemap.xml
git commit -m "fix: publish only completed articles"
```

---

### Task 3: Restore indexable commercial pages without redesigning the UI

**Files:**
- Create: `src/pages/expertise-detail.html`
- Create: `src/pages/open-source-detail.html`
- Create: `src/pages/accompagnement-detail.html`
- Create: `src/pages/contact-detail.html`
- Modify: `src/pages/home.html`
- Modify: `src/pages/expertise.html`
- Modify: `src/pages/open-source.html`
- Modify: `src/pages/accompagnement.html`
- Modify: `src/parts/nav.html`
- Modify: `assets/styles.css`
- Modify: `build.mjs`
- Modify: `tests/site.test.mjs`
- Generated/modify: `index.html`, `expertise/index.html`, `open-source/index.html`, `accompagnement/index.html`, `contact/index.html`, article outputs

**Interfaces:**
- Consumes: existing landing sections and CSS component classes.
- Produces: four standalone, indexable detail pages plus direct internal links, while the homepage keeps its current section flow and visual system.

- [ ] **Step 1: Write the failing page architecture test**

```js
test('builds indexable commercial detail pages and keeps the landing UI', () => {
  const home = read('index.html');

  assert.match(home, /class="iso-stage"/);
  assert.match(home, /href="\/expertise\/"/);
  assert.match(home, /href="\/open-source\/"/);
  assert.match(home, /href="\/accompagnement\/"/);

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
```

Replace the existing test `redirects legacy commercial routes and removes them from the sitemap`; those routes are no longer redirects. Update the landing/navigation assertions that currently expect `/#expertise` and `/#contact` on internal pages so they expect `/expertise/` and `/contact/`.

- [ ] **Step 2: Run the page test and verify RED**

```bash
node --test --test-name-pattern="builds indexable commercial" tests/site.test.mjs
```

Expected: FAIL because the current commercial files are noindex redirect documents and the homepage has no direct detail links.

- [ ] **Step 3: Add standalone page templates using existing classes**

Each detail template uses the existing article shell, with no new visual system. The expertise page starts with this concrete structure:

```html
<section class="section" id="detail">
  <div class="wrap">
    <article class="article">
      <header class="article-head">
        <nav class="article-back" aria-label="Fil d'Ariane"><a href="/">Accueil</a></nav>
        <h1>Expertise Data, Kubernetes, GitOps et MLOps</h1>
        <p class="article-sub">Kubotal conçoit, déploie et opère des plateformes Data et IA ouvertes sur Kubernetes.</p>
      </header>
      <div class="article-body">
        <h2>Comment concevoir l'architecture d'une plateforme Data ?</h2>
        <p>Kubotal assemble le stockage objet, le lakehouse et les moteurs de traitement selon les usages, les contraintes d'exploitation et les compétences de l'équipe.</p>
      </div>
    </article>
  </div>
</section>
```

Use these fixed headings and content boundaries:

- `expertise-detail.html`: H1 « Expertise Data, Kubernetes, GitOps et MLOps »; H2 blocks for architecture, Kubernetes/GitOps, MLOps/IA, and security/governance; end link to `/accompagnement/` and `/contact/`.
- `open-source-detail.html`: H1 « Écosystème open source pour les plateformes Data »; introductory wording « Kubotal présente OKDP, KuboCD et KubAuth… »; a real `<table>` with columns Projet, Rôle, Source officielle; no ownership claim; end links to the KuboCD article and `/contact/`.
- `accompagnement-detail.html`: H1 « Accompagnement de plateformes Data et IA »; ordered sections Cadrage, Build, Run, Transfert; end link to `/contact/`.
- `contact-detail.html`: H1 « Parler de votre plateforme avec Kubotal »; preserve only `contact@kubotal.io`, 30 minutes, and sans engagement; include a short list of useful first-call inputs without promising response time.

Wrap the open-source `<table>` in `.article-table-wrap` and add only these functional styles to `assets/styles.css`:

```css
.article-table-wrap{overflow-x:auto}
.article-table{width:100%;border-collapse:collapse;min-width:620px}
.article-table th,.article-table td{padding:14px 16px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.article-table th{color:var(--ink);font-size:.9rem}
```

- [ ] **Step 4: Add descriptive detail links to the landing sections**

Reuse `.btn`, `.btn-ghost`, `.btn-sm`, or `.os-link` classes. Add links whose visible labels name their targets:

```html
<a class="btn btn-ghost btn-sm" href="/expertise/">Découvrir l'expertise Kubotal</a>
<a class="os-link" href="/open-source/">Explorer l'écosystème open source</a>
<a class="btn btn-ghost btn-sm" href="/accompagnement/">Voir les modes d'accompagnement</a>
```

Keep the hero structure and animation hooks, but change only its search-facing copy:

```html
<h1 data-anim>Plateformes Data et IA<br>sur <span class="hl">Kubernetes</span>.</h1>
<p class="lead" data-anim>Kubotal conçoit, déploie et opère des plateformes Data et IA ouvertes sur Kubernetes, avec GitOps, MLOps, sécurité et gouvernance.</p>
```

- [ ] **Step 5: Generate the detail pages and direct internal navigation**

Add the four detail entries to `PAGES` with `page('expertise-detail')`, `page('open-source-detail')`, `page('accompagnement-detail')`, and `page('contact-detail')`. Remove `LEGACY_REDIRECTS` and `renderRedirect`.

Keep homepage nav anchors. For every internal page, map them to direct URLs:

```js
const navFor = (p) => {
  if (p.id === 'home') return NAV;
  let html = NAV
    .replace('href="#expertise"', 'href="/expertise/"')
    .replace('href="#open-source"', 'href="/open-source/"')
    .replace('href="#accompagnement"', 'href="/accompagnement/"')
    .replaceAll('href="#contact"', 'href="/contact/"');
  if (p.nav) html = html.replace(`href="/${p.nav}/"`, `href="/${p.nav}/" aria-current="page"`);
  return html;
};
```

- [ ] **Step 6: Run focused tests, full tests, and build**

```bash
node --test --test-name-pattern="builds indexable commercial" tests/site.test.mjs
node --test tests/site.test.mjs
node build.mjs
```

Expected: all commands exit 0; the landing still contains `.iso-stage`; the four commercial outputs have one H1 and no noindex.

- [ ] **Step 7: Commit the page architecture**

```bash
git add src build.mjs tests/site.test.mjs index.html expertise open-source accompagnement contact articles
git commit -m "feat: add indexable commercial pages"
```

---

### Task 4: Make metadata, JSON-LD, sitemap, robots, and llms.txt agree

**Files:**
- Modify: `build.mjs`
- Modify: `src/articles.mjs`
- Modify: `src/pages/article-kubocd.html`
- Modify: `robots.txt`
- Modify: `llms.txt`
- Modify: `tests/site.test.mjs`
- Generated/modify: all public HTML and `sitemap.xml`

**Interfaces:**
- Consumes: each page's canonical URL, role, visible heading, description, breadcrumb items, and article dates.
- Produces: a self-contained `@graph`, aligned head metadata, an exact canonical sitemap, and crawler files that reference only public pages.

- [ ] **Step 1: Write failing metadata and graph tests**

Add helpers that extract `title`, meta description, canonical, and JSON-LD from built HTML. Then add:

```js
test('aligns indexable metadata, sitemap and the JSON-LD graph', () => {
  const paths = [
    'index.html',
    'expertise/index.html',
    'open-source/index.html',
    'accompagnement/index.html',
    'contact/index.html',
    'articles/index.html',
    'articles/kubocd-deployer-sans-maitriser-helm/index.html',
  ];

  for (const path of paths) {
    const html = read(path);
    const graph = JSON.parse(
      html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1] || '{}',
    )['@graph'];
    assert.ok(Array.isArray(graph));
    assert.ok(graph.some((node) => node['@id'] === 'https://kubotal.io/#organization'));
    assert.ok(graph.some((node) => node['@id'] === 'https://kubotal.io/#website'));
    assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
    assert.doesNotMatch(html, /name="robots" content="noindex/);
  }

  const sitemap = read('sitemap.xml');
  assert.equal((sitemap.match(/<loc>/g) || []).length, paths.length);
  assert.doesNotMatch(sitemap, /articles\/page\/2|okdp-distribution-data-kubernetes/);
});
```

Add a second test that verifies `BlogPosting.author` has `@type: Organization`, `name: Kubotal`, and `url`, while `datePublished` and `dateModified` match visible `<time>` elements.

- [ ] **Step 2: Run the metadata tests and verify RED**

```bash
node --test --test-name-pattern="aligns indexable metadata|BlogPosting" tests/site.test.mjs
```

Expected: FAIL because the existing JSON-LD is an array, omits `WebSite`, and the sitemap has only three URLs.

- [ ] **Step 3: Add page metadata and a stable graph builder**

Give every page `type`, `title`, `desc`, and optional `breadcrumb` metadata. Use these titles:

```text
Kubotal — Plateformes Data et IA sur Kubernetes
Expertise Data, Kubernetes, GitOps et MLOps — Kubotal
Open source : OKDP, KuboCD et KubAuth — Kubotal
Accompagnement plateforme Data et IA — Kubotal
Contacter Kubotal — Projet Data, IA ou Kubernetes
Articles Data, Kubernetes, GitOps et MLOps — Kubotal
KuboCD : déployer sur Kubernetes sans maîtriser Helm — Kubotal
```

Replace the JSON-LD array with:

```js
const jsonLd = (p) => JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [organizationNode(), websiteNode(), pageNode(p), ...extraNodes(p)],
});
```

Required relationships:

- `WebSite.publisher -> #organization`;
- `WebPage.isPartOf -> #website`;
- `BlogPosting.mainEntityOfPage -> canonical #webpage`;
- `BlogPosting.author` and `publisher` use explicit Organization name and URL;
- `CollectionPage` describes `/articles/`;
- `Service` is added only to expertise and accompaniment pages;
- `BreadcrumbList` matches the visible hierarchy;
- remove project URLs from `Organization.sameAs`.

- [ ] **Step 4: Make the article update visible and truthful**

Add `modified: '2026-08-24'` to the KuboCD article entry. In the visible header, retain publication and add:

```html
<time datetime="2026-08-24">Mis à jour le 24 août 2026</time>
<span>Par l'équipe Kubotal</span>
```

Add a direct summary before the first long paragraph and a condition block that states when KuboCD fits and when Helm alone is enough. Do not change technical claims beyond the existing sourced article.

- [ ] **Step 5: Generate an exact sitemap**

Generate only absolute canonical URLs from `PAGES`. Keep a truthful `<lastmod>` for the article. Remove `priority` and `changefreq` because they do not add verified page facts.

- [ ] **Step 6: Align crawler controls**

Set `robots.txt` to:

```text
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: *
Allow: /

Sitemap: https://kubotal.io/sitemap.xml
```

Update `llms.txt` so Core Pages lists `/`, `/expertise/`, `/open-source/`, `/accompagnement/`, `/contact/`, `/articles/`, and the KuboCD article. Remove every draft URL and avoid ownership wording.

- [ ] **Step 7: Run focused tests, full tests, and regenerate**

```bash
node --test --test-name-pattern="aligns indexable metadata|BlogPosting" tests/site.test.mjs
node --test tests/site.test.mjs
node build.mjs
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit the SEO graph and crawler alignment**

```bash
git add build.mjs src tests/site.test.mjs robots.txt llms.txt sitemap.xml index.html expertise open-source accompagnement contact articles
git commit -m "feat: align SEO metadata and crawler signals"
```

---

### Task 5: Verify the full story without changing the visual design

**Files:**
- Modify if verification reveals a defect: only files already owned by Tasks 2–4
- Update: `README.md` with the publication and SEO invariants

**Interfaces:**
- Consumes: the complete generated site.
- Produces: evidence that build, HTML behavior, links, static rendering, mobile/desktop visuals, and generated artifacts satisfy the spec.

- [ ] **Step 1: Document the publication invariants**

Add to `README.md`:

```markdown
### Invariants SEO

- Une entrée d'article sans `corps` reste un backlog interne et n'est jamais générée ni liée.
- Toute page publique possède un H1, une description, une canonique auto-référente et un graphe JSON-LD cohérent.
- Le sitemap et `llms.txt` sont dérivés ou alignés sur les seules URL publiques.
- Le contenu principal est rendu dans le HTML initial ; JavaScript améliore l'expérience mais ne porte pas le texte indexable.
```

Commit the documentation before testing build reproducibility:

```bash
git add README.md
git commit -m "docs: document SEO publication invariants"
```

- [ ] **Step 2: Run the complete automated verification**

```bash
node --test tests/site.test.mjs
node build.mjs
git diff --exit-code
```

Expected: all tests pass, build exits 0, and the generated outputs are reproducible with no diff.

- [ ] **Step 3: Start a local server and verify HTTP behavior**

```bash
python3 -m http.server 4173
```

Verify `/`, the four commercial pages, `/articles/`, and the KuboCD article return 200. Verify a former draft and `/articles/page/2/` return 404. Confirm core copy appears in View Source.

- [ ] **Step 4: Verify visual preservation in desktop and mobile browsers**

Check at least 1440×900 and 390×844:

- landing hero, isometric scene, cards, section flow, and menu remain intact;
- detail pages use existing Kubotal typography, spacing, buttons, and article layout;
- the open-source table scrolls or wraps without overflowing;
- the contact CTA remains usable;
- no console errors appear.

- [ ] **Step 5: Run static SEO assertions against committed outputs**

```bash
rg -n 'noindex' --glob '*.html' .
rg -n '<loc>' sitemap.xml
rg -n 'OAI-SearchBot|GPTBot|Sitemap:' robots.txt
```

Expected: no HTML `noindex` matches; seven sitemap locations; crawler directives present.

- [ ] **Step 6: Review the final diff and commit documentation or verification fixes**

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the user's pre-existing untracked image/video files may remain. If verification required a code fix, commit that fix separately with its matching regression test.

- [ ] **Step 7: Record the deployment handoff**

Report:

- commits created;
- test and build evidence;
- public URLs to inspect after deployment;
- Search Console actions: resubmit sitemap, inspect priority URLs, then validate the noindex issue;
- the 7/28/90-day measurement checkpoints;
- the fact that rankings and AI citations remain outcomes to measure, not guarantees.
