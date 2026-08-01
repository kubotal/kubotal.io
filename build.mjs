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

const ROOT = dirname(fileURLToPath(import.meta.url));
const part = (n) => readFileSync(join(ROOT, 'src/parts', n + '.html'), 'utf8');
const page = (n) => readFileSync(join(ROOT, 'src/pages', n + '.html'), 'utf8');

const SPRITE = part('sprite');
const NAV = part('nav');
const FOOTER = part('footer');
const SCRIPTS = part('scripts');

const SITE = 'https://kubotal.io';

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
    {
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
<link rel="canonical" href="${SITE}${p.url}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
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

<main id="top">
${rebase(page(p.id), p.depth)}
</main>

${FOOTER}

${rebase(SCRIPTS, p.depth)}
</body>
</html>
`;

let n = 0;
for (const p of PAGES) {
  const dest = join(ROOT, p.out);
  mkdirSync(dirname(dest), {recursive: true});
  writeFileSync(dest, render(p), 'utf8');
  console.log('  écrit  ' + p.out);
  n++;
}
console.log(`\n${n} pages générées.`);
