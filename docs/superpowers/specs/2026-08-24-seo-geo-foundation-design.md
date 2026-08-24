# Fondation SEO et GEO de kubotal.io

**Date :** 24 août 2026  
**Statut :** design approuvé en principe, en attente de revue du document  
**Marché de travail :** décideurs et équipes techniques B2B francophones  
**Conversion principale :** prise de contact par e-mail pour cadrer un projet

## Objectif

Rendre les pages utiles de `kubotal.io` explorables, indexables et compréhensibles par les moteurs de recherche et les moteurs génératifs, sans publier de contenu incomplet et sans promettre de classement.

Le résultat attendu est une fondation mesurable : les pages commerciales ont chacune un objectif clair, les brouillons ne sont plus exposés, les signaux canoniques concordent et le HTML initial contient le contenu ainsi que les données structurées qui le décrivent.

## Diagnostic verrouillé

Le 24 août 2026, le dépôt et le site public présentent les faits suivants :

- 15 fichiers HTML contiennent `noindex,follow` ;
- 10 de ces fichiers sont des sujets d'articles sans corps éditorial ;
- une page de pagination existe uniquement parce que ces brouillons figurent dans le catalogue public ;
- quatre anciennes routes commerciales renvoient un document HTTP 200 avec `meta refresh`, JavaScript, `noindex` et une canonique vers l'accueil ;
- `sitemap.xml` ne contient que l'accueil, la liste des articles et un article rédigé ;
- `llms.txt` recommande quatre URL actuellement exclues de l'index ;
- les pages déclarent `isPartOf: https://kubotal.io/#website`, mais aucune entité `WebSite` ne porte cet identifiant ;
- l'accueil, la liste des articles et l'article KuboCD rendent leur contenu principal dans le HTML initial ;
- les 11 tests actuels passent, mais aucun test ne protège l'indexabilité, les canoniques ou le graphe JSON-LD.

La cause racine de l'alerte Search Console est donc le modèle de publication dans `build.mjs` : le générateur produit et lie volontairement des pages incomplètes, puis tente de les neutraliser avec `noindex`.

## Faits préservés et limites éditoriales

Les éléments suivants proviennent du site actuel et sont conservés :

- Kubotal conçoit, déploie et opère des infrastructures ou plateformes Data et IA cloud-native ;
- les domaines présentés sont Kubernetes, GitOps, MLOps, sécurité, gouvernance et open source ;
- les modes d'accompagnement présentés sont cadrage, build, run et transfert ;
- les projets ou entités techniques présentés sont OKDP, KuboCD et KubAuth ;
- l'adresse de contact publique est `contact@kubotal.io` ;
- l'échange proposé dure 30 minutes et est sans engagement ;
- l'article KuboCD publié le 2 août 2026 reste la seule publication rédigée du catalogue actuel.

Les changements ne doivent pas inventer :

- de client, témoignage, étude de cas ou résultat chiffré ;
- de prix, délai de livraison ou garantie de performance ;
- de localisation commerciale ou de zone d'intervention non fournie ;
- d'auteur individuel, de diplôme ou de profil professionnel ;
- de propriété juridique d'OKDP, KuboCD ou KubAuth.

La formulation de travail pour les trois projets est « l'écosystème open source présenté par Kubotal ». Une affirmation plus forte sur leur propriété ou leur édition nécessitera un verrou factuel du propriétaire du site.

## Architecture de pages

L'expérience de landing page reste la porte d'entrée visuelle. Les résumés de l'accueil renvoient cependant vers des pages autonomes capables de répondre à une intention précise.

| URL | Rôle principal | Intention dominante | État cible |
| --- | --- | --- | --- |
| `/` | entité et proposition de valeur | plateforme Data et IA sur Kubernetes | indexable |
| `/expertise/` | détail des domaines d'intervention | expertise Data, Kubernetes, GitOps et MLOps | indexable |
| `/open-source/` | cartographie de l'écosystème | OKDP, KuboCD et KubAuth | indexable |
| `/accompagnement/` | modes de collaboration | accompagnement d'une plateforme Data et IA | indexable |
| `/contact/` | conversion et cadrage | contacter Kubotal pour un projet | indexable |
| `/articles/` | collection de contenus publiés | articles Data, Kubernetes et GitOps | indexable |
| `/articles/kubocd-deployer-sans-maitriser-helm/` | réponse technique approfondie | KuboCD, Helm et Flux | indexable |
| sujets sans `corps` | backlog éditorial interne | aucune tant que le texte manque | non générés et non liés |
| `/articles/page/2/` | pagination devenue vide | aucune | supprimée tant qu'elle n'est pas nécessaire |

Chaque page indexable reçoit :

- un seul `h1` cohérent avec son intention ;
- un `title` et une meta description propres à la page ;
- une canonique auto-référente absolue ;
- aucun `noindex` ;
- un contenu principal disponible sans JavaScript ;
- des liens internes descriptifs vers les pages voisines utiles.

## Navigation et circulation des signaux

Sur l'accueil, les liens de premier niveau peuvent continuer à faire défiler vers les sections locales. Chaque section ajoute un lien descriptif vers sa page détaillée.

Sur toutes les pages internes, la navigation pointe directement vers `/expertise/`, `/open-source/`, `/accompagnement/`, `/contact/` et `/articles/`. Elle ne renvoie plus systématiquement vers des fragments de la page d'accueil.

Les pages internes disposent d'un fil d'Ariane HTML court. L'article KuboCD relie la collection d'articles, l'expertise concernée et le contact. Les ancres évitent les libellés vagues comme « en savoir plus » lorsqu'un libellé descriptif tient dans l'interface.

## Modèle de publication des articles

`src/articles.mjs` reste la source de vérité éditoriale, mais le catalogue public utilise uniquement les entrées qui possèdent un `corps`.

Le générateur :

1. calcule `PUBLISHED_ARTICLES` à partir des entrées avec `corps` ;
2. construit la liste, la recherche, la pagination et le sitemap à partir de cette collection ;
3. ne génère aucune page de brouillon ;
4. supprime les sorties générées devenues obsolètes dans les répertoires d'articles ciblés ;
5. ne crée une page de pagination que lorsqu'un volume de publications la rend nécessaire.

Les sujets sans `corps` restent dans le fichier source comme backlog. Ils ne sont ni annoncés comme publiés, ni datés dans l'interface publique, ni présents dans les données JSON de recherche.

La suppression d'un brouillon public produit un 404 sur GitHub Pages. C'est intentionnel : ces URL n'ont jamais contenu de publication indexable et ne doivent pas rediriger en masse vers une page non équivalente.

## Contenu sémantique et GEO

### Accueil

Le `h1` anglais actuel devient une proposition française directe centrée sur « Plateformes Data et IA sur Kubernetes ». Le premier paragraphe nomme Kubotal et résume l'offre sans adjectifs invérifiables.

Les sections existantes restent visuellement reconnaissables. Leurs introductions sont reformulées pour donner la réponse dès la première phrase et nommer explicitement Kubotal, le service ou le projet concerné.

### Expertise

La page `/expertise/` explique les quatre domaines déjà présents : architecture de plateforme, Kubernetes et GitOps, MLOps et IA, sécurité et gouvernance. Pour chaque domaine, un bloc autonome décrit le problème traité, ce que Kubotal met en place et la condition dans laquelle l'intervention est pertinente.

### Open source

La page `/open-source/` présente OKDP, KuboCD et KubAuth dans un vrai tableau HTML avec leur rôle, le besoin traité et leur source officielle. Le texte distingue clairement les faits observables des liens d'affiliation qui ne sont pas encore verrouillés.

### Accompagnement

La page `/accompagnement/` transforme les quatre cartes actuelles en étapes lisibles : cadrage, build, run et transfert. Chaque étape répond à une question utilisateur et mène vers le contact.

### Contact

La page `/contact/` reprend uniquement les engagements existants : adresse e-mail, échange de 30 minutes et absence d'engagement. Elle explique ce que le visiteur peut apporter au premier échange, sans promettre de délai de réponse.

### Article KuboCD

L'article existant conserve ses faits et ses sources. La restructuration ajoute :

- un résumé direct de deux ou trois phrases avant le développement ;
- une attribution visible à « l'équipe Kubotal » ;
- la date de publication et une date de modification visible uniquement si la mise à jour est substantielle ;
- des sections dont la première phrase répond au titre de section ;
- un bloc décisionnel explicite « quand KuboCD convient / quand Helm seul suffit » ;
- des liens internes vers l'expertise, les articles et le contact.

L'article ne reçoit pas de profil `Person` inventé. Le JSON-LD utilise `Organization` comme auteur tant qu'un auteur individuel vérifiable n'est pas fourni.

## Métadonnées et données structurées

Le générateur produit un seul objet JSON-LD `@graph` par page. Les entités partagées utilisent des identifiants stables :

- `https://kubotal.io/#organization` pour `Organization` ;
- `https://kubotal.io/#website` pour `WebSite` ;
- `<canonique>#webpage` pour `WebPage` ou `CollectionPage` ;
- `<canonique>#article` pour `BlogPosting` ;
- `<canonique>#service` pour `Service` lorsque la page décrit effectivement un service ;
- `<canonique>#breadcrumb` pour `BreadcrumbList`.

Le graphe respecte les règles suivantes :

- `WebSite.publisher` référence l'organisation ;
- chaque `WebPage.isPartOf` référence le `WebSite` réellement déclaré ;
- `BlogPosting.mainEntityOfPage` référence la page canonique ;
- les dates du `BlogPosting` correspondent aux dates visibles ;
- l'auteur et l'éditeur portent un type, un nom et une URL ;
- les données structurées décrivent uniquement le contenu visible ;
- `sameAs` n'est pas utilisé pour relier l'organisation à des projets techniques distincts ;
- aucune donnée `FAQPage`, `Review`, `Product` ou `Offer` n'est ajoutée sans contenu visible correspondant.

Les titres restent descriptifs et concis. Les meta descriptions résument spécifiquement la page, sans liste artificielle de mots-clés.

## Accès des robots

`robots.txt` continue d'autoriser l'ensemble du contenu public et déclare le sitemap racine. Les règles explicitent l'accès de `OAI-SearchBot` pour la recherche ChatGPT. L'accès de `GPTBot` reste autorisé, comme il l'est déjà implicitement sous la règle générique actuelle.

Le fichier `llms.txt` est aligné sur les URL indexables et ne référence plus de redirections ou de brouillons. Il reste un complément expérimental, pas une preuve ni une garantie de visibilité.

Le projet reste statique : le contenu principal, les canoniques et les données structurées doivent apparaître dans la réponse HTML initiale.

## Baseline et mesure

Avant la première modification éditoriale, l'implémentation crée `docs/seo/2026-08-24-baseline.md` et y enregistre :

- les 15 URL actuellement en `noindex` ;
- les 3 URL du sitemap actuel ;
- les codes HTTP et canoniques observés ;
- la présence publique observée pour les requêtes de marque et de sujet ;
- un ensemble fixe de prompts GEO francophones ;
- la date, le moteur testé et la présence ou non de Kubotal, d'un lien direct et du sentiment associé.

Le prompt pool minimal couvre :

1. une entreprise pour concevoir une plateforme Data open source sur Kubernetes ;
2. un accompagnement pour industrialiser l'IA sur Kubernetes ;
3. une expertise conjointe Kubernetes, GitOps et MLOps ;
4. une plateforme Data sans dépendance propriétaire ;
5. la définition et les usages d'OKDP ;
6. la définition et les usages de KuboCD ;
7. le déploiement d'applications Helm sans exposer toute leur complexité ;
8. la sécurisation des accès Kubernetes sans circulation de kubeconfig.

Une mesure GEO n'est déclarée que si elle a été exécutée dans une session propre et reproductible. En l'absence d'accès à un moteur donné, le champ reste `non_mesure` ; aucune valeur n'est inventée.

Après publication, le suivi prioritaire est :

- pages valides et indexées dans Search Console ;
- impressions et clics non marqués par page et par requête ;
- prises de contact qualifiées issues de l'organique ;
- Share of Mentions et part de citations directes sur le même prompt pool ;
- contrôle manuel du contexte et du sentiment des mentions.

## Tests et vérification

Les changements suivent un cycle TDD. Les tests du build doivent échouer avant la modification qui les satisfait.

Les nouveaux tests vérifient le comportement généré, pas la présence d'une chaîne dans le code source :

1. le catalogue public ne contient que les articles avec `corps` ;
2. aucune sortie de brouillon ni pagination vide n'est produite ;
3. les pages indexables ne contiennent aucun `noindex` ;
4. chaque page indexable possède exactement un `h1`, un title, une description et une canonique auto-référente ;
5. le sitemap contient exactement les URL indexables générées ;
6. tous les liens internes de navigation ciblent une sortie générée ou un fragment présent ;
7. `llms.txt` ne référence que des URL publiques prévues ;
8. chaque JSON-LD est du JSON valide et ses identifiants référencés existent dans le graphe ;
9. le `BlogPosting` correspond au titre, à l'auteur et aux dates visibles ;
10. le contenu principal reste présent dans le HTML initial.

La vérification finale comprend :

- `node --test tests/site.test.mjs` ;
- `node build.mjs` ;
- `git diff --exit-code` après un second build pour confirmer la reproductibilité ;
- un serveur HTTP local et une vérification visuelle desktop/mobile ;
- un contrôle des liens et des codes HTTP locaux ;
- la validation du JSON-LD avec un parseur local, puis avec Schema.org ou Rich Results Test après publication ;
- un contrôle public de `robots.txt`, `sitemap.xml`, `llms.txt` et des canoniques après déploiement.

## Déploiement et suivi Search Console

Après le déploiement GitHub Pages :

1. soumettre de nouveau `https://kubotal.io/sitemap.xml` ;
2. inspecter l'accueil, les quatre pages commerciales, la collection et l'article ;
3. demander l'indexation des pages commerciales prioritaires ;
4. lancer la validation du motif `Exclue par la balise noindex` uniquement après constat que les anciennes sorties ont disparu ;
5. contrôler l'évolution à 7, 28 et 90 jours sans interpréter un délai de recrawl comme un échec de code.

## Hors périmètre

Cette itération ne comprend pas :

- la rédaction intégrale des dix articles en backlog ;
- une migration hors de GitHub Pages ;
- une campagne de backlinks ou de relations presse ;
- l'ajout d'un CMS, d'une base de données ou d'un système d'analytics ;
- la création de profils d'auteurs ou de pages locales sans données vérifiables ;
- une garantie de classement, de rich result ou de citation par un moteur IA.

## Critères d'acceptation

Le design est réalisé lorsque :

- les six pages de navigation et l'article publié sont générés, auto-canoniques et indexables ;
- aucun brouillon n'est généré, lié, recherché ou inclus dans le sitemap ;
- la pagination vide et ses fichiers obsolètes ont disparu ;
- `llms.txt`, `robots.txt`, les liens internes et le sitemap concordent ;
- le JSON-LD forme un graphe cohérent sans référence orpheline ;
- la landing page conserve son identité visuelle et ses interactions ;
- le contenu ajouté reste dans le périmètre des faits existants ;
- les tests, le build reproductible et la vérification visuelle passent ;
- la baseline de mesure est enregistrée avant les changements éditoriaux ;
- aucun résultat de classement n'est promis ou fabriqué.

## Références normatives

- Google Search Central, `noindex` : <https://developers.google.com/search/docs/crawling-indexing/block-indexing>
- Google Search Central, canoniques : <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
- Google Search Central, sitemaps : <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
- Google Search Central, titres : <https://developers.google.com/search/docs/appearance/title-link>
- Google Search Central, snippets : <https://developers.google.com/search/docs/appearance/snippet>
- Google Search Central, données structurées générales : <https://developers.google.com/search/docs/appearance/structured-data/sd-policies>
- Google Search Central, Article : <https://developers.google.com/search/docs/appearance/structured-data/article>
- Google Search Central, Organization : <https://developers.google.com/search/docs/appearance/structured-data/organization>
- Google Search Central, Breadcrumb : <https://developers.google.com/search/docs/appearance/structured-data/breadcrumb>
- OpenAI, robots d'exploration : <https://developers.openai.com/api/docs/bots>

