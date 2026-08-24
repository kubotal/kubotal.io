/**
 * Assemble l'artefact GitHub Pages à partir d'une liste blanche.
 * Les sources, tests, documents et images de référence restent dans le dépôt,
 * mais ne sont pas publiés avec le site.
 */
import {cpSync, mkdirSync, rmSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(ROOT, '.pages-artifact');

const copyFile = (relativePath) => {
  const destination = join(OUTPUT, relativePath);
  mkdirSync(dirname(destination), {recursive: true});
  cpSync(join(ROOT, relativePath), destination);
};

const copyDirectory = (relativePath) => {
  cpSync(join(ROOT, relativePath), join(OUTPUT, relativePath), {recursive: true});
};

rmSync(OUTPUT, {recursive: true, force: true});
mkdirSync(OUTPUT, {recursive: true});

for (const file of [
  'index.html',
  'CNAME',
  'google58a3511232b3ddeb.html',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'kubotal-logo-hero.png',
  'kubotal-logo-mark.png',
  'kubotal-logo-watermark.png',
  'assets/styles.css',
  'assets/app.js',
  'assets/favicon.svg',
]) copyFile(file);

for (const directory of [
  'expertise',
  'open-source',
  'accompagnement',
  'contact',
  'articles',
]) copyDirectory(directory);

console.log('Artefact GitHub Pages minimal écrit dans .pages-artifact/.');
