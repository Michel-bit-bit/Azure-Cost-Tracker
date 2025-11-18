# Master Regenerative Prompt: Azure Cost Tracker Application (V.10)

## OBJECTIF

Générer une application web complète et autonome sur une seule page pour le suivi des coûts Microsoft Azure. L'application doit être entièrement construite en **HTML, CSS et JavaScript vanilla**. Elle doit être pleinement fonctionnelle hors ligne, en stockant toutes les données dans l'IndexedDB du navigateur. L'intégralité de l'interface utilisateur et de tous les textes doivent être en français.

## STRUCTURE DU PROJET

Le projet doit être organisé en 3 fichiers principaux à la racine du projet, sans sous-dossiers :
-   `index.html`: Le document HTML principal.
-   `style.css`: La feuille de style pour l'ensemble de l'application.
-   `app.js`: Le fichier JavaScript unique contenant toute la logique de l'application.

## TECHNOLOGIES DE BASE

-   **HTML5**: Pour la structure sémantique du contenu.
-   **CSS3**: Pour un style moderne, responsive, et incluant des thèmes (clair/sombre). L'utilisation de variables CSS est fortement encouragée.
-   **JavaScript (ES6+) Vanilla**: Pour toute la logique de l'application, la manipulation du DOM et les interactions. **Aucun framework ou bibliothèque comme React, Vue, ou jQuery n'est autorisé.**
-   **IndexedDB**: Pour le stockage côté client de toutes les entrées de coûts.
-   **Chart.js**: Utiliser cette bibliothèque (via CDN) pour la visualisation des données.

## SPÉCIFICATIONS DÉTAILLÉES

### 1. Modèle de Données (défini dans `app.js`)

-   **Objet d'entrée de coût (`CostEntry`)**: Une entrée de coût doit être un objet JavaScript avec les propriétés suivantes : `id` (auto-incrémenté par IndexedDB), `month` (nombre, 0-11), `year` (nombre), `networking`, `storage`, `compute`, `management`, `marketplace` (tous des nombres), et `totalTTC` (nombre, optionnel).

### 2. Service IndexedDB (défini dans `app.js`)

-   Créer un objet ou une classe `db` qui abstrait toutes les opérations IndexedDB : `init`, `getAllEntries`, `addEntry`, `updateEntry`, `deleteEntry`, `exportData`, `importData`.
-   Toutes les interactions avec la base de données doivent passer par ce module.

### 3. Logique Principale de l'Application (`app.js`)

-   Utiliser une variable d'état globale (ex: `let state = {...}`) pour gérer l'état de l'application, y compris la liste des `entries`, les sélections pour la comparaison, l'année du bilan, etc.
-   Une fonction de rendu principale (`render()`) doit être appelée après chaque modification de l'état pour rafraîchir l'interface utilisateur.
-   Récupérer et trier toutes les entrées de la base de données au chargement initial et après toute modification de données.

### 4. Composants de l'Interface Utilisateur (gérés par des fonctions de rendu dans `app.js`)

#### 4.1. Modale d'Ajout/Modification (Formulaire de saisie)

-   Le formulaire doit contenir des champs pour le Mois, l'Année, et toutes les catégories de coûts (`networking`, `storage`, etc.).
-   **Champ Total TTC**: Inclure une entrée de texte pour un `Prix TTC` manuel.
-   **Case à cocher HT**: Inclure une case à cocher avec le libellé "Les montants des catégories sont en HT".
-   **Calcul en direct**: Afficher une "Somme des catégories (calculée TTC)" qui se met à jour en temps réel lorsque l'utilisateur tape. Ce total doit refléter la taxe appliquée si la case HT est cochée.
-   **Logique de Soumission (Cruciale)**:
    1.  Si la **case HT n'est PAS cochée**:
        -   Toutes les valeurs saisies sont considérées TTC.
        -   Le `totalTTC` final sauvegardé est la valeur du champ "Prix TTC" si elle est fournie ; sinon, c'est la somme des autres catégories.
    2.  Si la **case HT EST cochée**:
        -   La logique est **autoritaire** : le total est **calculé** et non saisi.
        -   Toutes les valeurs de catégories saisies sont considérées HT.
        -   Le champ de saisie "Prix TTC" est **obligatoirement désactivé et sa valeur est ignorée**.
        -   Le `totalTTC` final est **uniquement** calculé comme suit : `(somme de toutes les catégories saisies en HT) * 1.20`.
        -   Les valeurs de catégories individuelles sont aussi sauvegardées en TTC (`valeur HT * 1.20`).

#### 4.2. Liste des Entrées

-   Afficher une liste de toutes les entrées de coûts.
-   Le coût total affiché pour chaque entrée doit être sa propriété `totalTTC` si elle existe, sinon c'est la somme de ses parties.
-   Inclure une barre de recherche pour filtrer les entrées par mois et année.
-   Inclure un bouton pour basculer le tri par date (ascendant/descendant).
-   Fournir des boutons "Modifier" et "Supprimer" pour chaque entrée.
-   **Comportement de défilement**: Sur les écrans larges (>1024px), la hauteur de ce panneau doit correspondre à celle du panneau de comparaison, et la liste des entrées doit défiler en interne si elle dépasse la hauteur disponible.

#### 4.3. Vue de Comparaison

-   Fournir des menus déroulants indépendants pour le mois et l'année pour chacune des deux périodes à comparer.
-   Afficher deux graphiques en anneau (via Chart.js), un pour chaque entrée sélectionnée.
-   **Logique de la Catégorie "Autre"**: Pour chaque graphique, calculer la somme des catégories de coûts détaillées. Si la propriété `totalTTC` de l'entrée est supérieure à cette somme, afficher la différence comme une catégorie distincte "Autre" dans le graphique.
-   Afficher un résumé de la comparaison : la différence en pourcentage entre les deux totaux.

#### 4.4. Bilan Annuel

-   Inclure un menu déroulant pour sélectionner l'année du bilan.
-   Afficher un graphique à barres montrant le coût total pour chaque mois de l'année sélectionnée.
-   Afficher des statistiques clés :
    -   Coût total pour l'année.
    -   Différence entre les coûts du premier et du dernier mois.
    -   Variation en pourcentage par rapport au coût total de l'année précédente (N-1).

#### 4.5. Modale d'Options

-   Fournir une option pour basculer entre les thèmes Clair, Sombre et Système. Le réglage doit être sauvegardé dans le `localStorage`.
-   L'implémentation du thème doit se faire en ajoutant/supprimant un attribut `data-theme="dark"` sur l'élément `<html>`.
-   Fournir des boutons "Exporter en JSON" et "Importer depuis JSON" qui utilisent le service `db`. L'importation doit écraser toutes les données existantes après une demande de confirmation.

### 5. Style et Ergonomie

-   Le design doit être propre, moderne et responsive.
-   Utiliser des variables CSS pour les couleurs afin de faciliter la gestion des thèmes.
-   Les graphiques doivent être clairs, lisibles, et avoir des infobulles (tooltips) informatives au survol. Implémenter une infobulle HTML personnalisée pour un meilleur contrôle du style et du positionnement.
-   L'application doit être intuitive et facile à utiliser.