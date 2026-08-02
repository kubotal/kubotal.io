/**
 * Assemble les pages du site à partir de src/parts + src/pages.
 *
 * Le site est déployé tel quel (GitHub Pages, aucune étape de build côté serveur) :
 * ce script écrit donc directement les fichiers finaux à la racine. Il évite de
 * maintenir cinq fois le même head, la même nav et le même pied de page.
 *
 *   node build.mjs
 */
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ARTICLES, PAR_PAGE, dateFr} from './src/articles.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const part = (n) => readFileSync(join(ROOT, 'src/parts', n + '.html'), 'utf8');
const page = (n) => readFileSync(join(ROOT, 'src/pages', n + '.html'), 'utf8');

const SPRITE = part('sprite');
const NAV = part('nav');
const SCRIPTS = part('scripts');

const SITE = 'https://kubotal.io';

const echappe = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NB_PAGES_LISTE = Math.max(1, Math.ceil(ARTICLES.length / PAR_PAGE));

/* Une ligne de la liste. Le résumé est tronqué à deux lignes en CSS : la hauteur
   d'une ligne ne dépend donc pas de la longueur du texte, et cent articles
   s'empilent aussi régulièrement que trois. */
const ligneArticle = (a, prefixe) => `
        <a class="glass post" href="${prefixe}articles/${a.slug}/" style="--tint:${a.tint}"
           data-recherche="${echappe((a.titre + ' ' + a.resume + ' ' + a.tag).toLowerCase())}">
          <div>
            <div class="post-meta">
              <span class="post-tag">${echappe(a.tag)}</span>
              <time datetime="${a.date}">${dateFr(a.date)}</time>
              <span aria-hidden="true">·</span>
              <span>${a.minutes} min de lecture</span>
            </div>
            <h3>${echappe(a.titre)}</h3>
            <p>${echappe(a.resume)}</p>
          </div>
          <span class="post-go" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-arrow"/></svg></span>
        </a>`;

/* Pagination rendue au build : les pages 2 et suivantes sont de vraies URL,
   partageables et indexables, et la liste fonctionne sans JavaScript. */
const pagination = (num, prefixe) => {
  if (NB_PAGES_LISTE < 2) return '';
  const lien = (n) => (n === 1 ? `${prefixe}articles/` : `${prefixe}articles/page/${n}/`);
  const pages = Array.from({length: NB_PAGES_LISTE}, (_, i) => i + 1)
    .map((n) =>
      n === num
        ? `<span class="page-num is-current" aria-current="page">${n}</span>`
        : `<a class="page-num" href="${lien(n)}">${n}</a>`)
    .join('\n          ');
  return `
      <nav class="pagination" aria-label="Pagination des articles">
        <a class="page-fleche${num === 1 ? ' is-off' : ''}" href="${lien(Math.max(1, num - 1))}"
           ${num === 1 ? 'aria-disabled="true" tabindex="-1"' : ''} rel="prev">
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg><span class="sr-only">Page précédente</span>
        </a>
        <div class="page-nums">
          ${pages}
        </div>
        <a class="page-fleche${num === NB_PAGES_LISTE ? ' is-off' : ''}" href="${lien(Math.min(NB_PAGES_LISTE, num + 1))}"
           ${num === NB_PAGES_LISTE ? 'aria-disabled="true" tabindex="-1"' : ''} rel="next">
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg><span class="sr-only">Page suivante</span>
        </a>
      </nav>`;
};

/* Le corps de la page de liste. Le champ de recherche est injecté par app.js :
   sans JavaScript il ne ferait rien, autant ne pas l'afficher du tout. */
const pageListe = (num, prefixe) => {
  const debut = (num - 1) * PAR_PAGE;
  const lot = ARTICLES.slice(debut, debut + PAR_PAGE);
  return `  <section class="section" id="articles">
    <div class="wrap">
      <div class="section-head">
        <span class="eyebrow" data-anim>Articles</span>
        <h2 data-anim>Notes de terrain.</h2>
        <p class="lead" data-anim>Ce qu'on lit, ce qu'on teste et ce qu'on retient sur les plateformes
          data, Kubernetes et le GitOps.</p>
      </div>

      <div class="posts-tete">
        <p class="posts-compte" id="posts-compte">${ARTICLES.length} articles<span class="posts-page">
          · page ${num} sur ${NB_PAGES_LISTE}</span></p>
      </div>

      <div class="posts" id="posts">${lot.map((a) => ligneArticle(a, prefixe)).join('\n')}
      </div>

      <p class="posts-vide" id="posts-vide" hidden>Aucun article ne correspond à cette recherche.</p>
${pagination(num, prefixe)}
    </div>
  </section>

  <script type="application/json" id="articles-data">${JSON.stringify(
    ARTICLES.map((a) => ({
      s: a.slug, t: a.titre, r: a.resume, g: a.tag, c: a.tint,
      d: a.date, f: dateFr(a.date), m: a.minutes,
    })))}</script>`;
};

/* Page d'un sujet prévu mais pas encore rédigé : mieux vaut une page honnête
   qu'un lien mort dans la liste. Elle porte un noindex, pour ne pas peupler
   l'index des moteurs de pages sans contenu. */
const pageBrouillon = (a) => `  <section class="section" id="article">
    <div class="wrap">
      <article class="article">
        <header class="article-head">
          <a class="article-back" href="/articles/"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg>Tous les articles</a>
          <h1>${echappe(a.titre)}</h1>
          <p class="article-sub">${echappe(a.resume)}</p>
          <div class="post-meta" style="--tint:${a.tint};margin-top:22px">
            <span class="post-tag">${echappe(a.tag)}</span>
            <span>${a.minutes} min de lecture</span>
          </div>
        </header>
        <div class="article-body">
          <div class="article-note">
            <p><strong>Article en préparation.</strong> Le sujet est au programme, le texte n'est
              pas encore écrit. Si le sujet vous concerne aujourd'hui, écrivez-nous : on répondra
              plus vite que la publication.</p>
          </div>
          <div class="article-end">
            <a class="article-back" href="/articles/"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-arrow"/></svg>Tous les articles</a>
            <a class="btn btn-accent btn-sm" href="/contact/">Parler de votre plateforme</a>
          </div>
        </div>
      </article>
    </div>
  </section>`;

/** Les entrées de PAGES correspondant aux listes paginées et aux articles. */
const pagesArticles = () => {
  const listes = Array.from({length: NB_PAGES_LISTE}, (_, i) => i + 1).map((num) => ({
    id: `liste-articles-${num}`,
    corpsHtml: pageListe(num, num === 1 ? '/' : '/'),
    out: num === 1 ? 'articles/index.html' : `articles/page/${num}/index.html`,
    depth: num === 1 ? 1 : 3,
    nav: 'articles',
    url: num === 1 ? '/articles/' : `/articles/page/${num}/`,
    noindex: num > 1,
    title: num === 1 ? 'Articles — Kubotal' : `Articles, page ${num} — Kubotal`,
    desc: 'Notes de terrain sur les plateformes data, Kubernetes, le GitOps et l’open source, par l’équipe Kubotal.',
  }));

  const articles = ARTICLES.map((a) => ({
    id: a.corps || `brouillon-${a.slug}`,
    corpsHtml: a.corps ? null : pageBrouillon(a),
    out: `articles/${a.slug}/index.html`,
    depth: 2,
    nav: 'articles',
    url: `/articles/${a.slug}/`,
    /* `flow` : la page se lit en défilant, son contenu ne doit pas être centré. */
    flow: true,
    noindex: !a.corps,
    article: a.corps
      ? {published: a.date, section: a.tag, readingTime: `PT${a.minutes}M`}
      : null,
    title: `${a.titre} — Kubotal`,
    desc: a.resume,
  }));

  return [...listes, ...articles];
};

/** `out` : chemin du fichier généré. `depth` : nombre de « ../ » pour remonter à la racine. */
const PAGES = [
  {
    id: 'home',
    out: 'index.html',
    depth: 0,
    nav: null,
    url: '/',
    title: 'Kubotal — Plateformes Data, IA, Kubernetes et GitOps',
    desc: 'Kubotal conçoit, déploie et opère des plateformes Data & IA cloud-native avec Kubernetes, GitOps, MLOps et open source.',
  },
  {
    id: 'expertise',
    out: 'expertise/index.html',
    depth: 1,
    nav: 'expertise',
    url: '/expertise/',
    title: 'Expertise Data, IA, Kubernetes et GitOps — Kubotal',
    desc: 'Architecture de plateforme data, Kubernetes et GitOps, MLOps et IA, sécurité et gouvernance : les quatre domaines sur lesquels Kubotal intervient.',
  },
  {
    id: 'open-source',
    out: 'open-source/index.html',
    depth: 1,
    nav: 'open-source',
    url: '/open-source/',
    title: 'Open source : OKDP, KuboCD, KubAuth — Kubotal',
    desc: 'OKDP, KuboCD et KubAuth : les trois projets open source que Kubotal construit au grand jour, pour des plateformes data sur Kubernetes.',
  },
  {
    id: 'accompagnement',
    out: 'accompagnement/index.html',
    depth: 1,
    nav: 'accompagnement',
    url: '/accompagnement/',
    title: 'Accompagnement : cadrage, build, run, transfert — Kubotal',
    desc: 'Du cadrage à l’exploitation : quatre façons de travailler avec Kubotal sur votre plateforme data et IA.',
  },
  ...pagesArticles(),
  {
    id: 'contact',
    out: 'contact/index.html',
    depth: 1,
    nav: 'contact',
    url: '/contact/',
    title: 'Contact — Kubotal',
    desc: 'Un échange de 30 minutes pour cadrer votre besoin de plateforme data et IA. Sans engagement.',
  },
];

/* La nav est écrite une fois, en liens racine-absolus : rien à réécrire par page.
   On marque seulement la page courante. */
const navFor = (id) =>
  id
    ? NAV.replace(`href="/${id}/"`, `href="/${id}/" aria-current="page"`)
    : NAV;

/* Les chemins d'assets sont relatifs dans les partiels : on les préfixe selon la profondeur. */
const rebase = (html, depth) =>
  depth === 0 ? html : html.replace(/(href|src)="assets\//g, `$1="${'../'.repeat(depth)}assets/`);

const jsonLd = (p) =>
  JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Kubotal',
      url: `${SITE}/`,
      logo: `${SITE}/kubotal-logo-mark.png`,
      email: 'contact@kubotal.io',
      description:
        'Kubotal conçoit, déploie et opère des plateformes Data, IA, Kubernetes et GitOps pour les équipes cloud-native.',
      sameAs: ['https://okdp.io/', 'https://www.kubocd.io/', 'https://github.com/kubauth/kubauth'],
      knowsAbout: ['Data platform', 'Artificial intelligence', 'Kubernetes', 'GitOps', 'MLOps', 'Open source'],
    },
    p.article
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          '@id': `${SITE}${p.url}#article`,
          url: `${SITE}${p.url}`,
          headline: p.title.replace(/ — Kubotal$/, ''),
          description: p.desc,
          datePublished: p.article.published,
          dateModified: p.article.published,
          articleSection: p.article.section,
          timeRequired: p.article.readingTime,
          author: {'@id': `${SITE}/#organization`},
          publisher: {'@id': `${SITE}/#organization`},
          inLanguage: 'fr-FR',
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${SITE}${p.url}#webpage`,
          url: `${SITE}${p.url}`,
          name: p.title,
          description: p.desc,
          isPartOf: {'@id': `${SITE}/#website`},
          about: {'@id': `${SITE}/#organization`},
          inLanguage: 'fr-FR',
        },
  ]);

const render = (p) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${SITE}${p.url}">${p.noindex ? '\n<meta name="robots" content="noindex,follow">' : ''}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="${p.article ? 'article' : 'website'}">
<meta property="og:site_name" content="Kubotal">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:url" content="${SITE}${p.url}">
<meta property="og:image" content="${SITE}/kubotal-logo-hero.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLd(p)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${'../'.repeat(p.depth)}assets/styles.css">
</head>
<body>

${SPRITE}

${navFor(p.nav)}

<main id="top"${p.flow ? ' data-flow' : ''}>
${rebase(p.corpsHtml ?? page(p.id), p.depth)}
</main>

${rebase(SCRIPTS, p.depth)}
</body>
</html>
`;

/* Le sitemap est dérivé de PAGES : ajouter un article suffit, il n'y a pas de
   liste à tenir à jour en parallèle — et donc pas de sitemap qui dérive. */
const sitemap = () => {
  const prio = (p) =>
    p.url === '/' ? '1.0' : p.article ? '0.8' : p.url === '/articles/' ? '0.85' : '0.9';
  const entrees = PAGES.filter((p) => !p.noindex).map((p) => `  <url>
    <loc>${SITE}${p.url}</loc>${p.article ? `\n    <lastmod>${p.article.published}</lastmod>` : ''}
    <priority>${prio(p)}</priority>
    <changefreq>${p.article ? 'yearly' : 'monthly'}</changefreq>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entrees}
</urlset>
`;
};

let n = 0;
for (const p of PAGES) {
  const dest = join(ROOT, p.out);
  mkdirSync(dirname(dest), {recursive: true});
  writeFileSync(dest, render(p), 'utf8');
  console.log('  écrit  ' + p.out);
  n++;
}
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap(), 'utf8');
console.log('  écrit  sitemap.xml');

console.log(`\n${n} pages générées.`);
