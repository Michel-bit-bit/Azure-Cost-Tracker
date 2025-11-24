
# Master Regenerative Prompt: Azure Cost Tracker Application (V.12.1)

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
-   **IndexedDB**: Pour le stockage côté client de toutes les entrées de coûts et des notes.
-   **Chart.js**: Utiliser cette bibliothèque (via CDN) pour la visualisation des données.

## SPÉCIFICATIONS DÉTAILLÉES

### 1. Modèle de Données (défini dans `app.js`)

-   **Objet d'entrée de coût (`CostEntry`)**: `id`, `month`, `year`, `networking`, `storage`, `compute`, `management`, `marketplace`, `autre` (nombres), et `totalTTC` (nombre).
-   **Objet de note (`Note`)**: `id`, `content` (chaîne), `date` (chaîne ISO).

### 2. Service IndexedDB (défini dans `app.js`)

-   Version de la DB : **2**.
-   Magasins (Stores) : `costEntries` et `notes`.
-   Fonctions CRUD complètes pour les deux entités.
-   Import/Export JSON doit gérer les deux types de données.

### 3. Logique Principale (`app.js`)

-   État global gérant `entries` et `notes`.
-   Rendu réactif simple basé sur l'état.

### 4. Composants de l'Interface Utilisateur

#### 4.1. Header

-   Titre de l'application.
-   **Actions à droite** :
    -   Bouton "Bloc-notes" (icône blanche type presse-papier).
    -   Bouton "Options" (icône roue dentée).

#### 4.2. Modale "Bloc-notes"

-   **Zone de saisie** : Textarea pour saisir une nouvelle note ou modifier une note existante.
-   **Liste des notes** : Affichage antéchronologique des notes sauvegardées.
-   Chaque note affiche sa date (format français JJ/MM/AAAA HH:MM), son contenu, et des boutons "Modifier" et "Supprimer".

#### 4.3. Modale d'Ajout/Modification de Coûts

-   Champs : Mois, Année, Networking, Storage, Compute, Management, Marketplace, **Autre**.
-   Case à cocher "Montants en HT".
-   Champ "Prix TTC" (désactivé si HT coché).
-   Logique de calcul HT -> TTC (x1.20) rigoureuse.

#### 4.4. Liste des Entrées & Graphiques

-   Liste scrollable, triable et filtrable des coûts mensuels.
-   Comparaison mensuelle avec Doughnut Charts (Chart.js).
-   Bilan annuel avec Bar Chart.
-   Gestion des couleurs via variables CSS.

#### 4.5. Modale d'Options

-   Sélecteur de thème (Clair/Sombre/Système).
-   Export/Import JSON complet (Coûts + Notes).
-   **Info Bibliothèques** : Doit afficher explicitement "Chart.js (v4.4.2)".

### 5. Style

-   Design propre et responsive (Grid/Flexbox).
-   Support natif du mode sombre via `prefers-color-scheme` et classe CSS.
