/**
 * Assemble les pages du site à partir de src/parts + src/pages.
 *
 * Le site est déployé tel quel (GitHub Pages, aucune étape de build côté serveur) :
 * ce script écrit donc directement les fichiers finaux à la racine. Il évite de
 * maintenir cinq fois le même head, la même nav et le même pied de page.
 *
 *   node build.mjs
 */
import {readFileSync, writeFileSync, mkdirSync, rmSync} from 'node:fs';
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

const PUBLISHED_ARTICLES = ARTICLES.filter((article) => article.corps);
const NB_PAGES_LISTE = Math.max(1, Math.ceil(PUBLISHED_ARTICLES.length / PAR_PAGE));

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
  const lot = PUBLISHED_ARTICLES.slice(debut, debut + PAR_PAGE);
  return `  <section class="section" id="articles">
    <div class="wrap">
      <div class="section-head">
        <span class="eyebrow" data-anim>Articles</span>
        <h1 data-anim>Notes de terrain.</h1>
        <p class="lead" data-anim>Ce qu'on lit, ce qu'on teste et ce qu'on retient sur les plateformes
          data, Kubernetes et le GitOps.</p>
      </div>

      <div class="posts-tete">
        <p class="posts-compte" id="posts-compte">${PUBLISHED_ARTICLES.length} article${PUBLISHED_ARTICLES.length > 1 ? 's' : ''}<span class="posts-page">
          · page ${num} sur ${NB_PAGES_LISTE}</span></p>
      </div>

      <div class="posts" id="posts">${lot.map((a) => ligneArticle(a, prefixe)).join('\n')}
      </div>

      <p class="posts-vide" id="posts-vide" hidden>Aucun article ne correspond à cette recherche.</p>
${pagination(num, prefixe)}
    </div>
  </section>

  <script type="application/json" id="articles-data">${JSON.stringify(
    PUBLISHED_ARTICLES.map((a) => ({
      s: a.slug, t: a.titre, r: a.resume, g: a.tag, c: a.tint,
      d: a.date, f: dateFr(a.date), m: a.minutes,
    })))}</script>`;
};

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
    pageType: 'CollectionPage',
    title: num === 1 ? 'Articles Data, Kubernetes, GitOps et MLOps — Kubotal' : `Articles Data et Kubernetes, page ${num} — Kubotal`,
    desc: 'Notes de terrain sur les plateformes data, Kubernetes, le GitOps et l’open source, par l’équipe Kubotal.',
  }));

  const articles = PUBLISHED_ARTICLES.map((a) => ({
    id: a.corps,
    corpsHtml: null,
    out: `articles/${a.slug}/index.html`,
    depth: 2,
    nav: 'articles',
    url: `/articles/${a.slug}/`,
    /* `flow` : la page se lit en défilant, son contenu ne doit pas être centré. */
    flow: true,
    article: {
      published: a.date,
      modified: a.modified ?? a.date,
      section: a.tag,
      readingTime: `PT${a.minutes}M`,
    },
    breadcrumb: [
      {name: 'Articles', url: '/articles/'},
      {name: a.titre, url: `/articles/${a.slug}/`},
    ],
    title: `${a.titre} — Kubotal`,
    desc: a.resume,
  }));

  return [...listes, ...articles];
};

/* La FAQ OKDP est une donnée unique : le HTML visible et le JSON-LD FAQPage en sont
   tous deux dérivés, ils ne peuvent donc pas diverger. Texte brut uniquement. */
const OKDP_FAQ = [
  {
    q: 'OKDP est-il gratuit ?',
    a: 'Oui. OKDP est distribué sous licence Apache 2.0, sans coût de licence. Les coûts réels sont ceux de l’infrastructure Kubernetes et de l’exploitation.',
  },
  {
    q: 'Que signifie OKDP ?',
    a: 'OKDP signifie Open Kubernetes Data Platform : une plateforme de données open source conçue pour s’exécuter sur Kubernetes.',
  },
  {
    q: 'Qui développe OKDP ?',
    a: 'OKDP est un projet communautaire hébergé par l’association TOSIT, initié par la DGFiP et rejoint par Orange et d’autres organisations. Kubotal fait partie des contributeurs du code.',
  },
  {
    q: 'Quels composants OKDP propose-t-il ?',
    a: 'OKDP assemble notamment Apache Spark, Trino, Hive Metastore, Apache Airflow, JupyterHub et Apache Superset, complétés par un Control Plane qui les instancie par projet.',
  },
  {
    q: 'Faut-il un cluster Kubernetes pour utiliser OKDP ?',
    a: 'Oui. OKDP s’installe sur un cluster Kubernetes que vous gérez. Pour un essai, le sandbox officiel crée un cluster local avec Kind sur une machine de 16 Go de RAM.',
  },
  {
    q: 'Comment installer OKDP ?',
    a: 'Le plus simple est le sandbox officiel : il crée un cluster Kubernetes local avec Kind, puis installe Flux, KuboCD et la plateforme. En production, OKDP se déploie en GitOps sur votre cluster.',
  },
  {
    q: 'OKDP peut-il remplacer Cloudera ou Hadoop ?',
    a: 'Oui pour les usages de traitement Spark, de SQL et d’orchestration : OKDP remplace HDFS par un stockage objet, YARN par Kubernetes et Oozie par Airflow. Les usages centrés sur HBase ou le temps réel demandent une étude préalable.',
  },
  {
    q: 'Qui propose du support pour OKDP ?',
    a: 'OKDP n’a pas d’éditeur. Le support vient de la communauté, de votre équipe interne et des sociétés de services qui contribuent au projet. Kubotal, contributeur du code, propose cadrage, build, run et transfert.',
  },
  {
    q: 'OKDP est-il une plateforme souveraine ?',
    a: 'OKDP apporte la maîtrise technique : licence Apache 2.0, composants standards, déploiement sur l’infrastructure de votre choix. La souveraineté juridique dépend ensuite de votre hébergeur.',
  },
  {
    q: 'Peut-on installer un seul composant d’OKDP ?',
    a: 'Oui. Les modules sont utilisables séparément avec Helm, sans le Control Plane. Le Control Plane devient utile quand plusieurs équipes partagent la plateforme.',
  },
];

const faqHtml = (faq) => faq.map((item) => `          <h3>${echappe(item.q)}</h3>
          <p>${echappe(item.a)}</p>`).join('\n');

const LANDING_SECTIONS = ['home', 'expertise', 'open-source', 'accompagnement', 'contact'];
const landing = () => LANDING_SECTIONS.map((id) => page(id)).join('\n');

/** `out` : chemin du fichier généré. `depth` : nombre de « ../ » pour remonter à la racine. */
const PAGES = [
  {
    id: 'home',
    corpsHtml: landing(),
    out: 'index.html',
    depth: 0,
    nav: null,
    url: '/',
    flow: true,
    title: 'Kubotal — Plateformes Data et IA sur Kubernetes',
    desc: 'Kubotal conçoit, déploie et opère des plateformes Data et IA ouvertes sur Kubernetes, avec GitOps, MLOps, sécurité et gouvernance.',
  },
  {
    id: 'expertise',
    corpsHtml: page('expertise-detail'),
    out: 'expertise/index.html',
    depth: 1,
    nav: 'expertise',
    url: '/expertise/',
    flow: true,
    service: 'Architecture de plateformes Data et IA',
    breadcrumb: [
      {name: 'Accueil', url: '/'},
      {name: 'Expertise', url: '/expertise/'},
    ],
    title: 'Expertise Data, Kubernetes, GitOps et MLOps — Kubotal',
    desc: 'Architecture Data, Kubernetes et GitOps, MLOps, sécurité et gouvernance : les domaines d’intervention de Kubotal.',
  },
  {
    id: 'open-source',
    corpsHtml: page('open-source-detail'),
    out: 'open-source/index.html',
    depth: 1,
    nav: 'open-source',
    url: '/open-source/',
    flow: true,
    breadcrumb: [
      {name: 'Accueil', url: '/'},
      {name: 'Open source', url: '/open-source/'},
    ],
    title: 'Open source : OKDP, KuboCD et KubAuth — Kubotal',
    desc: 'Kubotal présente OKDP, KuboCD et KubAuth pour les plateformes Data, la livraison GitOps et les accès Kubernetes.',
  },
  {
    id: 'okdp',
    corpsHtml: page('okdp-detail').replace('<!--FAQ-->', faqHtml(OKDP_FAQ)),
    out: 'okdp/index.html',
    depth: 1,
    nav: 'okdp',
    url: '/okdp/',
    flow: true,
    lastmod: '2026-11-12',
    faq: OKDP_FAQ,
    software: {
      name: 'OKDP',
      alternateName: 'Open Kubernetes Data Platform',
      description: 'Plateforme de données open source et cloud-native pour Kubernetes.',
      url: 'https://okdp.io/',
      sameAs: ['https://okdp.io/', 'https://github.com/OKDP'],
      license: 'https://www.apache.org/licenses/LICENSE-2.0',
    },
    breadcrumb: [
      {name: 'Accueil', url: '/'},
      {name: 'Open source', url: '/open-source/'},
      {name: 'OKDP', url: '/okdp/'},
    ],
    title: 'OKDP : plateforme Data open source Kubernetes — Kubotal',
    desc: 'OKDP (Open Kubernetes Data Platform) expliqué par un contributeur : architecture, composants, sandbox, cas d’usage et accompagnement Kubotal.',
  },
  {
    id: 'accompagnement',
    corpsHtml: page('accompagnement-detail'),
    out: 'accompagnement/index.html',
    depth: 1,
    nav: 'accompagnement',
    url: '/accompagnement/',
    flow: true,
    service: 'Accompagnement de plateformes Data et IA',
    breadcrumb: [
      {name: 'Accueil', url: '/'},
      {name: 'Accompagnement', url: '/accompagnement/'},
    ],
    title: 'Accompagnement plateforme Data et IA — Kubotal',
    desc: 'Cadrage, build, run et transfert : quatre modes d’accompagnement Kubotal pour les plateformes Data et IA.',
  },
  {
    id: 'contact',
    corpsHtml: page('contact-detail'),
    out: 'contact/index.html',
    depth: 1,
    nav: 'contact',
    url: '/contact/',
    flow: true,
    breadcrumb: [
      {name: 'Accueil', url: '/'},
      {name: 'Contact', url: '/contact/'},
    ],
    title: 'Contacter Kubotal — Projet Data, IA ou Kubernetes',
    desc: 'Un échange de 30 minutes pour cadrer un besoin de plateforme Data, IA ou Kubernetes avec Kubotal, sans engagement.',
  },
  ...pagesArticles(),
];

/* Sur la landing, les ancres restent locales : aucun nouveau document n'est chargé.
   Depuis les pages internes, la navigation pointe vers les pages canoniques. */
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

/* Les chemins d'assets sont relatifs dans les partiels : on les préfixe selon la profondeur. */
const rebase = (html, depth) =>
  depth === 0 ? html : html.replace(/(href|src)="assets\//g, `$1="${'../'.repeat(depth)}assets/`);

const ORGANIZATION_ID = `${SITE}/#organization`;
const WEBSITE_ID = `${SITE}/#website`;
const canonicalUrl = (p) => `${SITE}${p.url}`;
const pageId = (p) => `${canonicalUrl(p)}#webpage`;

const organizationNode = () => ({
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'Kubotal',
  url: `${SITE}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE}/kubotal-logo-mark.png`,
  },
  email: 'contact@kubotal.io',
  description:
    'Kubotal conçoit, déploie et opère des plateformes Data et IA ouvertes sur Kubernetes.',
  knowsAbout: [
    'Data platform', 'Artificial intelligence', 'Kubernetes', 'GitOps', 'MLOps', 'Open source',
    'OKDP', 'Open Kubernetes Data Platform', 'KuboCD', 'KubAuth',
  ],
  sameAs: ['https://www.linkedin.com/company/kubotal', 'https://github.com/kubotal','https://github.com/kubocd', 'https://github.com/kubauth'],
});

const websiteNode = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE}/`,
  name: 'Kubotal',
  publisher: {'@id': ORGANIZATION_ID},
  inLanguage: 'fr-FR',
});

const pageNode = (p) => ({
  '@type': p.pageType ?? 'WebPage',
  '@id': pageId(p),
  url: canonicalUrl(p),
  name: p.title,
  description: p.desc,
  isPartOf: {'@id': WEBSITE_ID},
  about: {'@id': ORGANIZATION_ID},
  ...(p.article ? {mainEntity: {'@id': `${canonicalUrl(p)}#article`}} : {}),
  ...(p.service ? {mainEntity: {'@id': `${canonicalUrl(p)}#service`}} : {}),
  ...(p.software ? {mainEntity: {'@id': `${canonicalUrl(p)}#software`}} : {}),
  ...(p.breadcrumb ? {breadcrumb: {'@id': `${canonicalUrl(p)}#breadcrumb`}} : {}),
  inLanguage: 'fr-FR',
});

const articleNode = (p) => ({
  '@type': 'BlogPosting',
  '@id': `${canonicalUrl(p)}#article`,
  url: canonicalUrl(p),
  headline: p.title.replace(/ — Kubotal$/, ''),
  description: p.desc,
  datePublished: p.article.published,
  dateModified: p.article.modified,
  articleSection: p.article.section,
  timeRequired: p.article.readingTime,
  mainEntityOfPage: {'@id': pageId(p)},
  author: {
    '@type': 'Organization',
    name: 'Kubotal',
    url: `${SITE}/`,
  },
  publisher: {'@id': ORGANIZATION_ID},
  inLanguage: 'fr-FR',
});

const serviceNode = (p) => ({
  '@type': 'Service',
  '@id': `${canonicalUrl(p)}#service`,
  name: p.service,
  description: p.desc,
  url: canonicalUrl(p),
  provider: {'@id': ORGANIZATION_ID},
});

const breadcrumbNode = (p) => ({
  '@type': 'BreadcrumbList',
  '@id': `${canonicalUrl(p)}#breadcrumb`,
  itemListElement: p.breadcrumb.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE}${item.url}`,
  })),
});

/* Kubotal n'est pas l'éditeur d'OKDP : le nœud décrit le logiciel et renvoie vers
   ses sources officielles, sans attribuer d'auteur ni d'éditeur. */
const softwareNode = (p) => ({
  '@type': 'SoftwareApplication',
  '@id': `${canonicalUrl(p)}#software`,
  ...p.software,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Kubernetes',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'EUR'},
});

const faqNode = (p) => ({
  '@type': 'FAQPage',
  '@id': `${canonicalUrl(p)}#faq`,
  mainEntity: p.faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {'@type': 'Answer', text: item.a},
  })),
  inLanguage: 'fr-FR',
});

const jsonLd = (p) => {
  const graph = [organizationNode(), websiteNode(), pageNode(p)];
  if (p.article) graph.push(articleNode(p));
  if (p.service) graph.push(serviceNode(p));
  if (p.software) graph.push(softwareNode(p));
  if (p.faq) graph.push(faqNode(p));
  if (p.breadcrumb) graph.push(breadcrumbNode(p));
  return JSON.stringify({'@context': 'https://schema.org', '@graph': graph});
};

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
<link rel="preload" href="/assets/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${'../'.repeat(p.depth)}assets/styles.css">
</head>
<body>

${SPRITE}

${navFor(p)}

<main id="top" data-page="${p.id}"${p.flow ? ' data-flow' : ''}>
${rebase(p.corpsHtml ?? page(p.id), p.depth)}
</main>

${rebase(SCRIPTS, p.depth)}
</body>
</html>
`;

/* Le sitemap est dérivé de PAGES : ajouter un article suffit, il n'y a pas de
   liste à tenir à jour en parallèle — et donc pas de sitemap qui dérive. */
const sitemap = () => {
  const entrees = PAGES.filter((p) => !p.noindex).map((p) => `  <url>
    <loc>${SITE}${p.url}</loc>${p.lastmod ?? p.article?.modified ? `\n    <lastmod>${p.lastmod ?? p.article.modified}</lastmod>` : ''}
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entrees}
</urlset>
`;
};

rmSync(join(ROOT, 'articles', 'page'), {recursive: true, force: true});
for (const article of ARTICLES.filter((entry) => !entry.corps)) {
  rmSync(join(ROOT, 'articles', article.slug), {recursive: true, force: true});
}

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
