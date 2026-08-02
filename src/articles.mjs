/**
 * Le catalogue d'articles. C'est la seule source de vérité : la liste, la
 * pagination, la recherche, les pages d'article et le sitemap en découlent.
 *
 * `corps` : nom du fichier dans src/pages/ pour un article rédigé.
 *           Sans lui, l'article est un sujet prévu — sa page affiche un avis
 *           « en préparation » et porte un noindex, pour ne pas se retrouver
 *           indexée comme une page vide.
 */
export const ARTICLES = [
  {
    slug: 'kubocd-deployer-sans-maitriser-helm',
    corps: 'article-kubocd',
    titre: 'KuboCD : déployer sur Kubernetes sans maîtriser Helm',
    tag: 'GitOps',
    tint: '#00966A',
    date: '2026-08-02',
    minutes: 8,
    resume:
      'Un chart Helm emballé dans une image OCI, déployé par une ressource de quelques lignes. ' +
      'Ce que fait vraiment KuboCD, ce qu’il délègue à Flux, et ce qu’il faut savoir avant de s’y mettre.',
  },
  {
    slug: 'okdp-distribution-data-kubernetes',
    titre: 'OKDP : ce qu’apporte une distribution data sur Kubernetes',
    tag: 'Open source',
    tint: '#5B3DF5',
    date: '2026-07-24',
    minutes: 7,
    resume:
      'Assembler Spark, Trino, Superset et le reste à la main coûte cher en intégration. ' +
      'Ce qu’une distribution prend en charge, et ce qu’elle vous laisse encore à faire.',
  },
  {
    slug: 'trino-autoscaling-cout-reel',
    titre: 'Trino sur Kubernetes : le coût réel de l’autoscaling',
    tag: 'Data',
    tint: '#1685FF',
    date: '2026-07-15',
    minutes: 9,
    resume:
      'Ajouter des workers ne fait pas baisser la latence de la même façon selon la requête. ' +
      'Où se situe vraiment le point d’équilibre entre temps de réponse et facture.',
  },
  {
    slug: 'iceberg-catalogue-compaction',
    titre: 'Iceberg : le format compte moins que le catalogue',
    tag: 'Data',
    tint: '#1685FF',
    date: '2026-07-03',
    minutes: 8,
    resume:
      'Le choix du format de table occupe les débats, mais ce sont le catalogue et la stratégie ' +
      'de compaction qui décident des performances au bout de six mois.',
  },
  {
    slug: 'mlops-reproductibilite-registry',
    titre: 'Un registry de modèles ne suffit pas à la reproductibilité',
    tag: 'MLOps',
    tint: '#5B3DF5',
    date: '2026-06-19',
    minutes: 6,
    resume:
      'Versionner les poids ne rejoue pas un entraînement. Ce qu’il faut figer en plus pour ' +
      'qu’un modèle soit réellement reconstructible.',
  },
  {
    slug: 'rbac-kubernetes-erreurs-frequentes',
    titre: 'RBAC Kubernetes : cinq erreurs qu’on retrouve partout',
    tag: 'Sécurité',
    tint: '#D97706',
    date: '2026-06-05',
    minutes: 7,
    resume:
      'Des ClusterRole trop larges aux ServiceAccount partagés entre équipes : la trame ' +
      'd’audit qu’on applique en début de mission.',
  },
  {
    slug: 'secrets-jobs-ephemeres-vault',
    titre: 'Distribuer des secrets à des jobs éphémères',
    tag: 'Sécurité',
    tint: '#D97706',
    date: '2026-05-22',
    minutes: 6,
    resume:
      'Pourquoi les secrets Kubernetes statiques finissent toujours par fuiter, et à quoi ' +
      'ressemble une chaîne de distribution qui tient sur la durée.',
  },
  {
    slug: 'spark-kubernetes-dimensionnement',
    titre: 'Spark sur Kubernetes : dimensionner sans surpayer',
    tag: 'Data',
    tint: '#38B7FF',
    date: '2026-05-09',
    minutes: 9,
    resume:
      'Mémoire d’exécuteur, shuffle et instances spot : les trois réglages qui expliquent ' +
      'l’essentiel de l’écart de facture entre deux clusters identiques.',
  },
  {
    slug: 'observabilite-plateforme-data',
    titre: 'Ce qu’on regarde quand une plateforme data ralentit',
    tag: 'Exploitation',
    tint: '#0B63F6',
    date: '2026-04-28',
    minutes: 6,
    resume:
      'Quatre signaux expliquent la grande majorité des incidents. Les tableaux de bord ' +
      'qu’on met en place en premier, et ceux qu’on ne met pas.',
  },
  {
    slug: 'bootstrap-cluster-gitops',
    titre: 'Bootstrapper un cluster de zéro, sans script maison',
    tag: 'GitOps',
    tint: '#00966A',
    date: '2026-04-11',
    minutes: 8,
    resume:
      'Ordre des dépendances, amorçage des secrets, problème de l’œuf et de la poule : ' +
      'comment amener un cluster vide à l’état de production de façon rejouable.',
  },
  {
    slug: 'kubauth-acces-clusters',
    titre: 'KubAuth : donner accès à vos clusters sans kubeconfig baladeur',
    tag: 'Open source',
    tint: '#5B3DF5',
    date: '2026-03-27',
    minutes: 7,
    resume:
      'Le fichier kubeconfig qui circule par messagerie reste la faille la plus banale. ' +
      'Une approche fondée sur l’identité, et ce qu’elle change à l’exploitation.',
  },
];

/** Nombre d'articles affichés par page de liste. */
export const PAR_PAGE = 10;

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const dateFr = (iso) => {
  const [a, m, j] = iso.split('-').map(Number);
  return `${j} ${MOIS[m - 1]} ${a}`;
};
