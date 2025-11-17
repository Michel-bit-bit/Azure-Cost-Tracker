# Dev Log - Suivi des coûts Azure

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