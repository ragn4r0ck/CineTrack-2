# CinéTrack v2

CinéTrack v2 est une évolution majeure de la plateforme CinéTrack, connectée à une API REST en ligne via MockAPI. Cette version permet aux administrateurs de gérer les contenus (CRUD complet) et aux utilisateurs de consulter et publier des avis et des notes sur les films et séries.

## Nouvelles fonctionnalités (v2)

### 1. Administration des films et séries (`admin.html`)
- Consultation de la liste complète des contenus sous forme de tableau.
- Formulaire unique pour l'ajout et la modification des titres.
- Validation des champs avec affichage des messages d'erreur sous chaque champ.
- Prévisualisation dynamique de l'affiche (image).
- Bascule automatique entre durée (film) et nombre de saisons (série).
- Modification avec préremplissage automatique des données.
- Suppression d'un titre avec demande de confirmation préalable.
- Filtrage rapide en temps réel dans le tableau d'administration.

### 2. Système d'avis et commentaires
- Affichage des commentaires associés à chaque titre dans sa modale de détails.
- Formulaire de publication avec validation (nom/pseudo et commentaire obligatoires).
- Mémorisation du pseudo de l'utilisateur dans le `localStorage`.
- Affichage immédiat du commentaire publié sans rechargement de la page.
- Message informatif si aucun commentaire n'a encore été posté.

### 3. Système de notation (Bonus)
- Attribution d'une note de 1 à 5 étoiles lors de la rédaction d'un avis.
- Calcul dynamique de la note moyenne avec `reduce()` et affichage dans la modale.
- Affichage de la note moyenne sur chaque carte du catalogue principal.

### 4. Améliorations techniques et bonus
- Utilisation de `Promise.all()` pour charger simultanément les titres et les avis.
- Debouncing sur le champ de recherche pour optimiser les performances.
- Messages de notification (toasts) pour confirmer les actions (ajout, modification, suppression, publication).
- Gestion complète des erreurs HTTP avec `response.ok` et try/catch.
- Utilisation de l'opérateur spread `...` pour la fusion des objets.

## Configuration de MockAPI

1. Rendez-vous sur [MockAPI.io](https://mockapi.io/) et créez un compte ou connectez-vous.
2. Créez un nouveau projet nommé **CineTrack** avec le préfixe `/api/v1`.
3. Créez la première ressource : **contents**
   - Schéma des champs :
     - `id` : Object ID
     - `title` : String
     - `image` : String
     - `description` : String
     - `type` : String (`movie` ou `series`)
     - `releaseYear` : Number
     - `duration` : Number
     - `seasons` : Array
     - `genres` : Array
     - `directors` : Array
     - `productionCountries` : Array
   - Cliquez sur **Data** et collez le contenu JSON des titres initiaux.
4. Créez la deuxième ressource : **comments**
   - Schéma des champs :
     - `id` : Object ID
     - `contentId` : String
     - `author` : String
     - `text` : String
     - `rating` : Number (de 1 à 5)
     - `createdAt` : Date
5. Récupérez votre URL de base (ex: `https://673752e2aafa2ef22233633e.mockapi.io/api/v1`).
6. Ouvrez le fichier `js/api.js` et remplacez `VOTRE-ID` par votre identifiant MockAPI :
   ```javascript
   const DEFAULT_URL = "https://VOTRE-ID.mockapi.io/api/v1";
   ```

## Structure du projet

```text
CineTrackv2/
├── index.html         Page catalogue avec filtres, recherche, pagination et modale
├── admin.html         Page d'administration (liste, ajout, modification, suppression)
├── js/
│   ├── api.js         Appels HTTP (GET, POST, PUT, DELETE) via fetch et gestion des erreurs
│   ├── ui.js          Génération des composants DOM, affichage des statuts, toasts et erreurs
│   ├── validation.js  Validation des données des formulaires
│   ├── storage.js     Gestion du localStorage (favoris, pseudo)
│   ├── main.js        Gestion de la page catalogue et des commentaires
│   └── admin.js       Gestion de la page administration et du CRUD
└── README.md          Documentation du projet
```

## Lancer le projet

Le projet utilise les modules JavaScript ES6 natifs (`import` / `export`). Il doit être servi par un serveur HTTP local :

1. Ouvrez le dossier `CineTrackv2` dans VS Code.
2. Faites un clic droit sur `index.html` et sélectionnez **Open with Live Server**.
3. L'application sera accessible sur `http://127.0.0.1:5500`.
