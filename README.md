# kubotal.io — v3

Site statique de Kubotal, construit autour d'une **landing page unique** et d'un espace
Articles multi-pages. La navigation commerciale se fait par ancres dans le même document,
sans rechargement de page.

Le site n'a aucune dépendance à installer. Un build Node assemble les fragments partagés et
génère les fichiers HTML déployés.

```bash
npx serve .
```

## Architecture des routes

Les contenus commerciaux vivent sur la même landing. Articles conserve de vraies routes
pour le partage, la lecture et l'indexation.

| Route | Contenu |
|---|---|
| `/` | Landing complète |
| `/#expertise` | Les 4 domaines d'intervention |
| `/#open-source` | OKDP, KuboCD, KubAuth |
| `/#accompagnement` | Cadrage, Build, Run, Transfert |
| `/#contact` | Prise de contact |
| `/articles/` | Catalogue d'articles |
| `/articles/<slug>/` | Article individuel |

Aperçu : `assets/pages-reference.png`.

### Le build

Le site est déployé sur GitHub Pages, sans serveur applicatif. Un petit script assemble la
landing, les pages Articles et les éléments partagés :

```
src/parts/   sprite, navigation, scripts — éléments communs
src/pages/   sections de la landing et corps d'articles
build.mjs    assemble la landing, les articles et les redirections
tests/       contrats du build, des routes et de l'accessibilité
```

```bash
node build.mjs
```

Le build doit être exécuté après toute modification de `src/`. La CI relance les tests et
refuse le déploiement si les fichiers générés ne sont pas synchronisés.

**Ne modifie jamais les `index.html` générés** : ils sont écrasés au build suivant.
Édite `src/`.

Chaque page reçoit son propre `<title>`, sa `meta description`, son `canonical`,
ses balises Open Graph et son JSON-LD `WebPage`. La nav marque la page courante
avec `aria-current="page"`, stylé par `.nav-links a[aria-current="page"]`.

## Largeur utile et échelle

Le conteneur plafonnait à **1200 px** : sur grand écran, tout le reste devenait de la marge.

- `.wrap` passe en **relatif**, avec une gouttière fluide bornée :
  `min(1760px, 100% - 2 * clamp(22px, 4.4vw, 110px))`. Les marges suivent l'écran au lieu
  d'exploser — 6 % à 1440, 8 % à 1920, contre 14 et 28 % avant.
  Le `clamp` évite deux écueils : une gouttière ridicule de 11 px sur mobile (ce que
  donnait un simple `94%`), et des marges sans fin sur très grand écran.
  Réglé à 4,4vw : à 50 px le logo collait au bord de l'écran.
- L'échelle typographique suit le cadre : titre `clamp(40px, 5.4vw, 88px)` au lieu de 72 px
  de plafond, chapô jusqu'à 22 px, titres de section jusqu'à 58 px, chiffres du hero
  fluides. Aperçu : `assets/largeurs-reference.png`.

### Répartition 60 / 40

Le hero est en `grid-template-columns: 60fr 40fr` : le texte porte la page, l'image
l'accompagne. La grille est calée à droite de sa colonne (`justify-self: end`).

Mais **des colonnes 60/40 ne donnent pas un rendu 60/40** : ce qu'on voit, c'est l'encre,
pas la boîte. Avec le titre plafonné à 88 px, le texte ne remplissait que 597 px d'une
colonne de 866 — soit 52/48 à l'œil, et 253 px de vide au milieu.

Deux réglages pour y arriver vraiment :

- le titre monte à `clamp(40px, 6.4vw, 112px)` et le chapô à `52ch` : le texte occupe
  enfin sa colonne (739 px d'encre) ;
- la colonne d'image est plafonnée à **430 px**, ce qui donne 511 px de grille projetée.

Résultat mesuré à 1680 px : **59 / 41**. Le rapport se calcule sur l'encre réelle du texte
(`Range.getClientRects`) et sur l'emprise réelle des tuiles, pas sur les colonnes.

### Le piège de l'élargissement

Élargir le conteneur écarte mécaniquement la grille du texte : les deux colonnes grandissent
et la grille, centrée dans la sienne, s'en va vers la droite. L'écart est passé de 34 px à
146 px en élargissant.

Deux fausses pistes essayées avant de trouver : ancrer la grille à gauche de sa colonne
(l'écart s'est aggravé — c'est la colonne de **texte** qui s'étirait), puis plafonner la
colonne de texte sans toucher à la grille (écart réduit à 15 px mais 420 px de vide à droite).

Ce qui marche : **colonne de texte plafonnée à 640 px**, grille centrée dans le reste et
plafonnée à 820 px.

| Viewport | Marge de page | Écart texte ↔ grille | Marge à droite |
|---|---|---|---|
| 1440 px | 43 px (6 %) | 64 px | grille débordant de 29 px, volontaire |
| 1920 px | 80 px (8 %) | 98 px | 90 px |

## Calage du hero

Le texte et la grille sont centrés l'un sur l'autre, et la masse de la grille est calée
dans son cadre. Aperçu : `assets/hero-reference.png`.

Ce qu'il a fallu régler :

- **La projection posait sa masse 43 px sous le centre du cadre** (134 px de vide au-dessus,
  48 en dessous). Corrigé par un calage optique en deux variables sur `.iso-plane` :
  `--nudge-x: -11%` et `--nudge-y: -1%`. Négatif = vers la gauche / vers le haut.
- Le `perspective-origin` était à `50% 46%` : remis au centre.
- Le cadre était carré alors que la projection isométrique est **plus large que haute** —
  passé en `aspect-ratio: 1/.82`, ce qui supprime le vide en haut et en bas.
- **La légende sous la grille a été retirée.** Elle poussait aussi la grille vers le haut :
  placée sous le cadre, elle allongeait la colonne et décalait le centrage de 31 px.
- Le paragraphe passait **11 px sous les tuiles** une fois la grille décalée à gauche.
  Ramené de `46ch` à `42ch` : marge réelle mesurée à 34 px après le dernier décalage.
  C'est la contrainte qui limite un décalage plus poussé vers la gauche.

## Les chiffres du hero

⚠️ Les valeurs (`3`, `100%`, `GitOps`) sont écrites **en clair dans le HTML**. Le compteur
ne remet à zéro qu'au premier battement réel de l'animation (`onStart`), pas avant.

La première version faisait l'inverse : le HTML portait `0` et il fallait que l'animation
tourne pour afficher la vraie valeur. Onglet en arrière-plan, `requestAnimationFrame` bridé,
GSAP bloqué par une CSP — et le visiteur lisait **0 projet open source, 0 % cloud-native**.

Règle générale sur cette page : ce qui compte est dans le HTML, l'animation ne fait que
l'enjoliver.

## La grille isométrique

Le bloc signature. Neuf tuiles en `transform: rotateX(56deg) rotateZ(45deg)`, reliées par
des pointillés animés. Aperçu : `assets/grille-3d-reference.png`.

- **Survol / focus** → `translateZ(52px)` : la tuile se soulève comme un bouton.
  La tuile centrale, plus grande (`--s: 1.26`), monte à 70 px.
  Pas de nom affiché : les logos parlent d'eux-mêmes, le nom reste dans l'`aria-label`.
- **Clic** → la tuile reste levée avec un liseré à sa couleur.
- **Glisser** → toute la scène tourne, sur 180°. Voir plus bas.
- Les icônes sont **contre-tournées** (`rotateZ(-45deg) rotateX(-56deg)`) pour rester face
  caméra pendant que les tuiles restent en isométrie.

### Les huit briques

Kubernetes · Spark · Airflow · Trino · Superset · Vault · MinIO · Kafka, autour de Kubotal.

Les tracés viennent du paquet npm **`simple-icons`** (officiels, `viewBox` 24×24), pas d'un
redessin de mémoire. Ils sont recolorés par `--tint` avec la couleur de marque de chaque
projet.

Deux tuiles ont un fond plein, comme dans la référence : **Vault** (jaune `#FFEC6E`,
illisible sur blanc) sur navy, et **MinIO** en blanc sur son rouge `#C72E49`.

⚠️ **Marques déposées.** Ces logos appartiennent à leurs détenteurs. L'usage « technologies
que nous mettons en œuvre » est courant, mais certains projets ont des règles d'usage
(Kubernetes/CNCF et HashiCorp notamment). À vérifier avant mise en ligne publique.

Pas d'icône **S3** : elles ont été retirées de `simple-icons` pour raisons de marque.
MinIO la remplace — stockage objet compatible S3, et open source, plus cohérent.

### De la fausse à la vraie 3D

Les tuiles étaient des **plans plats** : l'épaisseur n'était qu'une pile de `box-shadow`,
qui disparaît dès qu'on change d'angle. Ce n'était pas de la 3D.

Chaque tuile est maintenant un **solide** : 12 plans empilés en Z sur 16 px de profondeur,
générés en JS, assombris progressivement (`filter: brightness`) pour que la tranche prenne
la lumière de biais. Des plans empilés plutôt que 4 parois : le contour arrondi est
conservé et il n'y a aucun trou dans les angles. Aperçu : `assets/grille-3d-reference.png`.

La perspective est passée de 1400 px à **1100 px** — plus courte, le relief se voit.

### Rotation au curseur, 180°

Le plan lit son orientation dans deux variables CSS, `--rx` et `--rz`, pilotées au pointeur :

- **Glisser** fait tourner la scène. ⚠️ Plus aucun texte ne l'annonce depuis le retrait de
  la légende : seul le curseur `grab` le laisse deviner. `--rz` est bridé à ±90° autour de son repos (45°),
  soit **180° d'amplitude** ; `--rx` va de 8° à 88°.
- **Survoler** sans glisser incline légèrement, comme avant.
- **Double-cliquer** remet d'aplomb. Sortir de la zone aussi.
- Amortissement à 12 % par frame, en `requestAnimationFrame`.

Le point délicat : les icônes et les étiquettes se dévissent de la **même** rotation via
`calc(-1 * var(--rz))`. Sans ça, elles basculeraient avec la scène et deviendraient
illisibles dès le premier degré de rotation.

Vérifié par glissement simulé : butée droite **133,2°**, butée gauche **−42,7°**.

### Le clignotement au survol

Symptôme : passer le curseur sur une tuile la faisait vibrer.

Cause : la tuile se soulevait **vers la caméra**, donc elle sortait de sous le curseur.
Le survol se perdait, elle retombait, le curseur la retrouvait, elle remontait — boucle.
Un classique dès qu'on anime en `translateZ` l'élément qui porte lui-même le `:hover`.

Correction : le `<button>` ne bouge plus. Son contenu vit dans une coque `.tile-lift`
qui, elle, se soulève. La zone de survol reste immobile — vérifié, la boîte du bouton
ne bouge pas d'un pixel pendant que le visuel monte de 52 px.

Second point : un simple clic sur une tuile faisait pivoter la scène. Le glissement ne
s'enclenche désormais qu'au-delà de **4 px** de déplacement, et la capture du pointeur
n'est prise qu'à ce moment-là.

### Un piège corrigé

L'animation d'entrée (`gsap.from` avec `scale`) laissait un `transform` **en ligne** sur
chaque tuile une fois terminée. Cet inline écrasait le `transform: translateZ(var(--z))`
du CSS : **le survol ne soulevait plus rien**. Réglé avec `clearProps: 'transform,opacity'`
sur le tween d'entrée, pour rendre la main au CSS.

Vérifié : au repos `matrix(1,0,0,1,0,0)`, au survol `matrix3d(… 52 …)`.
Hub : `scale 1.26` + `z 26` au repos, `z 70` au survol.

## La marque tient lieu de « K »

Le mot ne porte plus son K initial : il s'écrit **UBOTAL** et c'est la marque qui fournit
le K. Conséquence directe sur la taille — une lettre se cale sur la hauteur de capitale,
pas au-dessus :

| | Capitale | Encre de la marque | Rapport |
|---|---|---|---|
| Lockup complet (avant) | 14,3 px | 27,7 px | 1,94 |
| Marque = lettre, calée sur la capitale | 15,7 px | 16,1 px | 1,03 — trop discrète |
| **Retenu** | 15,7 px | 22 px | **1,40** |

À 1,03 la marque, plus fine que les capitales grasses du mot, passait inaperçue. Au-delà
de 1,55 elle se détache et on relit « K UBOTAL » en deux blocs. Comparaison des rapports :
`assets/lockup-taille-reference.png`.

L'espace marque↔mot est une **chasse de lettre**, pas une marge de lockup : **2 px**.
Au-delà de 5 px la marque se détache et on lit « K UBOTAL » en deux morceaux.
Comparaison des chasses : `assets/lockup-reference.png`.

Le `viewBox` est resserré sur l'encre (`20 11 59 78`) au lieu du `-2 -2 100 100`
d'origine, qui contenait beaucoup de vide : `--mark-h` désigne une hauteur réelle.
Deux variables sur `.brand` suffisent à retailler :

```css
.brand{ --wm-size: 22px; --mark-h: 23px; gap: 2px }
.footer .brand{ --wm-size: 19px; --mark-h: 20px; gap: 2px }
```

⚠️ **Le nom complet reste lisible par les machines.** Le « UBOTAL » visible porte
`aria-hidden="true"`, doublé d'un `<span class="sr-only">Kubotal</span>`. Sans ça, un
lecteur d'écran annoncerait « ubotal » et les moteurs indexeraient un nom qui n'existe pas.

## Les jambes de la marque (nav)

Le lockup du header est celui d'origine : marque + « KUBOTAL », à sa place, immobile.
Seuls les **deux flux du K bougent**, comme des jambes.

- Foulée sur place, deux pas alternés : une jambe part en avant pendant que l'autre
  recule, puis elles échangent. Pivot commun à la jonction des flux sur le tronc — (35,50)
  dans le repère du SVG.
- Amplitude **±9°** (`SWING`), un pas dure 0,38 s (`BEAT`), le cycle complet 1,52 s.
  Le tronc accompagne d'un rebond de 1,5 px par appui.
- **Retour exact à 0°** en fin de cycle : la marque n'est jamais laissée déformée.
  Séquence vérifiée : `0° → +9/-9 → 0° → -9/+9 → 0°`.
- Se déclenche 0,6 s après le chargement, puis au survol et au focus clavier.
  Pas de boucle permanente — un logo qui gigote en continu dans une nav collante fatigue.
  Pour en faire une boucle : `gsap.timeline({ repeat: -1, repeatDelay: 4 })`.
- Le SVG du header a ses tracés **en clair** au lieu d'un `<use href="#mark">` : on ne peut
  pas viser un tracé à l'intérieur d'un `<use>`, son contenu vit dans un arbre fantôme.
  Partout ailleurs le `<use>` est conservé, donc une seule définition de la marque.
- Sans GSAP ou sous `prefers-reduced-motion`, le logo reste simplement statique et intact.

## Famille open source

OKDP, KuboCD et KubAuth reprennent le système du kit de marque : marque Kubotal en
monochrome teintée à la couleur du produit (violet / vert / ambre), halo assorti.

## Animations — ce qu'il a fallu ajouter

**GSAP 3.12 + ScrollTrigger**, via CDN. C'est la seule dépendance.

Le script est écrit pour que GSAP reste **facultatif** : les états initiaux sont posés par
`gsap.from()`, jamais en CSS. Si le CDN est bloqué, la page s'affiche complète au lieu de
rester invisible. Idem sous `prefers-reduced-motion: reduce`.

`ScrollTrigger.refresh()` est appelé au `load` : les webfonts décalent la mise en page et
sans ce recalcul certaines sections peuvent rester masquées.

## Contrôles effectués

- Rendu vérifié à 375 px et 1440 px
- `document.scrollWidth === clientWidth` sur mobile — pas de scroll horizontal
- Console sans erreur
- Icônes SVG uniquement, aucun emoji
- Chaque tuile est un `<button>` avec `aria-label` : accessible au clavier, élévation au `:focus-visible`

## Avant mise en production

- Décider du sort des 4 autres pages (port ou redirections)
- Vérifier les chiffres du hero (« 3 projets open source », « 100 % cloud-native »)
- Héberger GSAP en local si une CSP stricte est en place
- Reporter `favicon.svg`, `og:image` et le JSON-LD `Organization` du site actuel
