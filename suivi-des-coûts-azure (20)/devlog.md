
# Dev Log - Suivi des coûts Azure

## V.12.1 - 2024-05-30 (Correctif)

-   **Restauration Vanilla JS** : Correction critique de l'incident V.12 où des fichiers non conformes (React/TS) ont été introduits par erreur. Retour strict à la stack HTML/CSS/JS Vanilla de la V.11.
-   **Fonctionnalité Bloc-notes (Réintégration)** : Réimplémentation propre de la gestion des notes (CRUD) avec stockage IndexedDB (magasin `notes`).
-   **Versionnage DB** : Passage sécurisé de la DB en version 2 pour ajouter le magasin `notes` sans affecter les données existantes.
-   **Info Librairie** : Ajout de la mention explicite "v4.4.2" pour Chart.js dans la modale d'information.

## V.12 - 2024-05-30

-   *Version annulée pour instabilité et non-respect de la stack technique.*

## V.11 - 2024-05-30

- **Catégorie "Autre" Explicite** : La catégorie "Autre" est désormais un champ de saisie standard dans le formulaire d'ajout/modification, et non plus uniquement un calcul de remplissage.
- **Taxation de "Autre"** : Si la case "montants HT" est cochée, la TVA de 20% s'applique désormais également au montant saisi dans "Autre", qui s'ajoute au calcul du Total TTC.
- **Introduction de "Non alloué"** : Afin de maintenir la cohérence visuelle, si un utilisateur saisit un "Total TTC" global supérieur à la somme de toutes les catégories (y compris "Autre"), la différence est désormais affichée dans les graphiques sous le libellé "Non alloué" avec une couleur distincte.
- **Correction du Tri** : Résolution d'une régression mineure qui empêchait le tri ascendant par date de fonctionner correctement.

## V.10 - 2024-05-30

- **Clarification de la Règle HT**: La logique de la V.9 est confirmée. La TVA de 20% est appliquée au total des catégories pour former le 'Prix TTC' final **uniquement** lorsque la case 'montant HT' est cochée. Dans ce cas, toute saisie manuelle du 'Prix TTC' est désactivée et ignorée. Cette version n'apporte pas de changement de code, mais ancre cette spécification dans la documentation pour les développements futurs.

## V.9 - 2024-05-29

- **Correction de la Stack Technique**: Retour à une base de code 100% JavaScript vanilla, HTML et CSS, conformément aux instructions initiales. Abandon de la version non sollicitée en React/TypeScript.
- **Logique de Calcul HT Autoritair**: La règle de gestion pour la case "montant HT" a été finalisée. Lorsque cette case est cochée, le "Prix TTC" est **obligatoirement calculé** à partir de la somme des catégories (considérées HT) + 20% de TVA. Le champ de saisie manuelle du "Prix TTC" est désactivé et vidé dans ce mode pour garantir la cohérence des données.

## V.8 - 2024-05-28

- **Clarification de la Logique HT/TTC**: La logique de la case "montant HT" a été affinée. Désormais, si la case est cochée, la TVA de 20% est appliquée non seulement aux sous-catégories, mais également au champ "Prix TTC" s'il est renseigné par l'utilisateur. La case signifie maintenant que *tous* les montants saisis dans le formulaire sont considérés comme Hors Taxes.

## V.7 - 2024-05-27

- **Gestion des Montants HT/TTC**: Ajout d'une case à cocher "Les montants des catégories sont en HT" dans le formulaire d'ajout/modification.
- **Logique de Taxation**: Si la case est cochée, une taxe de 20% est appliquée à chaque sous-catégorie (compute, networking, etc.) au moment de la sauvegarde. Le champ "Prix TTC" n'est pas affecté et reste la source de vérité pour le total.
- **Feedback Utilisateur Amélioré**: La "Somme des catégories" affichée dans le formulaire est maintenant mise à jour en temps réel pour refléter le total TTC si la case HT est cochée, fournissant un retour immédiat à l'utilisateur.

## V.6 - 2024-05-26

- **Sélection de Période Améliorée**: Les menus déroulants de la "Comparaison Mensuelle" ont été scindés. Il est maintenant possible de sélectionner le mois et l'année de manière indépendante pour chaque période, offrant une plus grande flexibilité pour comparer des entrées non consécutives ou sur des années différentes.
- **Mise à jour de l'UI et de la Logique**: L'interface utilisateur et la logique de l'état de l'application ont été adaptées pour prendre en charge ce nouveau mode de sélection.

## V.5 - 2024-05-25

- **Correction Robuste du Défilement**: Implémentation d'une solution JavaScript pour garantir que la hauteur du panneau "Liste des Entrées" corresponde exactement à celle du panneau "Comparaison Mensuelle". Une fonction `adjustEntriesListHeight` synchronise les hauteurs après chaque rendu, résolvant de manière fiable le problème de l'étirement vertical de la page.
- **Gestion du Redimensionnement**: Ajout d'un écouteur d'événement `resize` sur la fenêtre pour appeler la fonction de synchronisation des hauteurs. Cela assure que la mise en page reste cohérente et fonctionnelle même lorsque l'utilisateur redimensionne son navigateur.
- **Simplification CSS**: Suppression de la `min-height` fixe sur le conteneur de la liste des entrées, car la hauteur est désormais gérée dynamiquement par JavaScript, ce qui crée un comportement plus prévisible et robuste.

## V.4 - 2024-05-24

- **Correction du Layout Principal**: La mise en page principale a été modifiée de `grid` à `flexbox` pour les écrans larges. Cela résout un problème où la liste des entrées étirait la page verticalement au lieu de devenir scrollable. Les panneaux de comparaison et de liste ont maintenant la même hauteur, s'adaptant au contenu le plus grand, ce qui permet un défilement interne correct.
- **Hauteur Minimale de la Liste**: Une hauteur minimale de 600px a été ajoutée à la carte "Liste des Entrées" pour garantir une bonne présentation et une zone de défilement adéquate même lorsque le panneau de comparaison est court.

## V.3 - 2024-05-23

- **Retour à la Stack Vanilla JS** : Annulation de la transition non sollicitée vers React/TypeScript. Le projet est de nouveau 100% en HTML, CSS et JavaScript vanilla, conformément aux exigences initiales.
- **Correction de la Liste d'Entrées Scrollable** : Résolution du problème de mise en page où le conteneur de la liste des entrées grandissait indéfiniment. Le conteneur a maintenant une hauteur fixe et une barre de défilement interne apparaît pour la liste des entrées lorsque le contenu dépasse, tandis que le titre, la recherche et le bouton de tri restent fixes.

## V.2 - 2024-05-22

- **Amélioration de la Saisie** : Ajout d'un champ "Prix TTC" dans le formulaire. L'utilisateur peut maintenant entrer manuellement le total. S'il est laissé vide, le total est calculé automatiquement à partir des sous-catégories.
- **Catégorie "Autre"** : Si le "Prix TTC" entré manuellement est supérieur à la somme des coûts des catégories, la différence est automatiquement calculée et affichée dans les graphiques en anneau comme une nouvelle catégorie "Autre".
- **Correction des Infobulles (Tooltips)** :
    - Remplacement des infobulles par défaut de Chart.js par une implémentation HTML personnalisée pour résoudre les problèmes de `z-index` et de fond transparent.
    - Correction d'un bug de positionnement de l'infobulle personnalisée.
    - Correction finale d'un bug de clignotement persistant en s'assurant que l'infobulle n'intercepte plus les événements de la souris (`pointer-events: none`), stabilisant ainsi son affichage.

## V.1 - 2024-05-21

- **Initialisation du Projet** : Création de la structure de base du projet avec trois fichiers principaux : `index.html`, `style.css`, et `app.js`, conformément aux exigences.
- **Stack Technique** : Le projet est développé exclusivement en HTML, CSS, et JavaScript (ES6+) vanilla, sans aucun framework comme React ou TypeScript.
- **Base de Données** : Implémentation d'un module de service pour interagir avec IndexedDB, permettant un stockage persistant des données entièrement côté client, sans nécessité de backend. Les opérations CRUD (Create, Read, Update, Delete) sont fonctionnelles.
- **Interface Utilisateur (UI)** :
    - Mise en place d'une mise en page responsive avec une barre de navigation, une grille de contenu principale et un bouton d'action flottant (FAB).
    - Création d'un système de modale générique pour les formulaires d'ajout/modification, les options et les informations.
    - Ajout de la fonctionnalité de thème (Clair, Sombre, Système) qui persiste dans le `localStorage`.
- **Fonctionnalités Clés** :
    - **Gestion des Entrées** : Ajout, modification, et suppression des entrées de coûts mensuels. La liste des entrées est consultable, triable (par date) et filtrable (via une barre de recherche).
    - **Comparaison Mensuelle** : Développement du panneau de comparaison permettant de sélectionner deux mois et de visualiser leurs coûts totaux, la différence en pourcentage, et deux graphiques en anneau (donut charts) détaillant la répartition des coûts.
    - **Bilan Annuel** : Création de la section de bilan annuel avec un sélecteur d'année. Affiche un graphique en barres des coûts mensuels et des statistiques clés (comparaison premier/dernier mois, total annuel, comparaison avec l'année N-1).
- **Visualisation de Données** : Intégration de la bibliothèque **Chart.js** pour générer les graphiques en anneau et en barres interactifs, avec des infobulles (tooltips) détaillées au survol.
- **Import/Export** : Ajout des fonctionnalités d'exportation de la base de données en JSON et d'importation depuis un fichier JSON pour la sauvegarde et la migration des données.
