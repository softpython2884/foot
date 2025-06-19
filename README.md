
# SportSphere - Votre Guide Ultime du Monde du Sport

Bienvenue sur SportSphere ! Cette application Next.js vous permet de consulter les informations des équipes de football, leurs matchs passés, et d'obtenir des résumés et réponses à vos questions grâce à l'IA. (Avec l'ambition de s'étendre à d'autres sports !)

## Table des Matières

1.  [Aperçu du Projet](#aperçu-du-projet)
2.  [Stack Technique](#stack-technique)
3.  [Prérequis](#prérequis)
4.  [Installation et Lancement](#installation-et-lancement)
    *   [Variables d'Environnement](#variables-denvironnement)
    *   [Lancement du Serveur de Développement](#lancement-du-serveur-de-développement)
    *   [Lancement de Genkit (IA)](#lancement-de-genkit-ia)
5.  [Structure du Projet](#structure-du-projet)
6.  [Concepts Clés et Modification du Code](#concepts-clés-et-modification-du-code)
    *   [Pages et Routage (Next.js App Router)](#pages-et-routage-nextjs-app-router)
    *   [Composants React (ShadCN UI)](#composants-react-shadcn-ui)
    *   [Styling (Tailwind CSS & Thèmes)](#styling-tailwind-css--thèmes)
    *   [Logique Côté Serveur (Server Actions)](#logique-côté-serveur-server-actions)
    *   [Base de Données (SQLite)](#base-de-données-sqlite)
    *   [Intégration API Externe (API-Sports)](#intégration-api-externe-api-sports)
    *   [Fonctionnalités IA (Genkit)](#fonctionnalités-ia-genkit)
    *   [Gestion de l'État (Context API)](#gestion-de-létat-context-api)
    *   [Données Fictives (Mock Data)](#données-fictives-mock-data)
7.  [API Publique](#api-publique)
8.  [Clés API](#clés-api)
9.  [Qualité du Code](#qualité-du-code)
10. [Dépannage](#dépannage)
11. [Contribuer et Étendre à d'Autres Sports](#contribuer-et-étendre-à-dautres-sports)

## Aperçu du Projet

SportSphere a pour objectif principal de permettre aux utilisateurs de :
*   Sélectionner un sport parmi une liste (Football, F1, Basketball, etc. - initialement Football est le plus développé).
*   Parcourir une liste d'équipes (ou entités sportives pertinentes) pour le sport sélectionné.
*   Consulter la page de profil détaillée de chaque équipe/entité.
*   Voir les matchs passés d'une équipe (pour le football initialement).
*   Interagir avec un assistant IA pour obtenir des résumés et des réponses à des questions spécifiques sur les équipes/entités.
*   (Fonctionnalités futures potentielles : paris, watchlist plus avancée, informations spécifiques à d'autres sports).

## Stack Technique

*   **Framework Frontend:** [Next.js](https://nextjs.org/) (avec App Router)
*   **Librairie UI:** [React](https://reactjs.org/)
*   **Composants UI:** [ShadCN UI](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Fonctionnalités IA:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
*   **API de Données Sportives:** [API-Football (api-sports.io)](https://www.api-football.com/) et potentiellement d'autres API du même fournisseur pour d'autres sports.
*   **Base de Données:** SQLite (via `sqlite` et `sqlite3`)
*   **Langage:** TypeScript

## Prérequis

*   [Node.js](https://nodejs.org/) (version 18.x ou plus recommandée)
*   [npm](https://www.npmjs.com/) (généralement inclus avec Node.js) ou [yarn](https://yarnpkg.com/)

## Installation et Lancement

1.  **Cloner le dépôt (si applicable) :**
    ```bash
    git clone [URL_DU_DEPOT]
    cd [NOM_DU_DOSSIER]
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    # ou
    # yarn install
    ```

3.  **Variables d'Environnement :**
    Créez un fichier `.env` à la racine du projet et ajoutez-y votre clé API pour API-Sports (utilisée pour le football et potentiellement d'autres sports du même fournisseur) :
    ```env
    # Clé API unique pour tous les services api-sports.io que vous utilisez
    API_SPORTS_KEY=VOTRE_CLE_API_SPORTS_ICI 
    ```
    Vous pouvez obtenir une clé API gratuite sur [api-football.com](https://dashboard.api-football.com/register) (ou le dashboard équivalent pour les autres sports). Le plan gratuit a des limitations (ex: 100 requêtes/jour par API, accès limité aux saisons récentes).

4.  **Initialiser la base de données :**
    La base de données SQLite (`db/app.db`) sera créée automatiquement au premier lancement si elle n'existe pas, grâce au script d'initialisation dans `src/lib/db.ts`.

5.  **Lancement du Serveur de Développement Next.js :**
    ```bash
    npm run dev
    ```
    L'application sera accessible sur `http://localhost:9002` (ou un autre port si spécifié).

6.  **Lancement de Genkit (IA) :**
    Pour que les fonctionnalités d'IA fonctionnent, vous devez lancer le serveur Genkit en parallèle.
    *   Pour un lancement simple :
        ```bash
        npm run genkit:dev
        ```
    *   Pour un lancement avec rechargement automatique en cas de modification des fichiers IA :
        ```bash
        npm run genkit:watch
        ```
    Genkit démarre généralement sur le port `3400` et son UI de développement sur `http://localhost:4000`.

## Structure du Projet

Voici un aperçu des dossiers importants :

```
.
├── src/
│   ├── app/                  # Pages et layouts (Next.js App Router)
│   │   ├── (auth)/           # Routes liées à l'authentification (ex: login, register)
│   │   ├── api/              # Endpoints de l'API publique
│   │   │   ├── sports/
│   │   │   │   ├── route.ts
│   │   │   │   └── [sportSlug]/
│   │   │   │       └── teams/
│   │   │   │           ├── route.ts
│   │   │   │           └── [teamSlug]/  # (spécifique football pour l'instant)
│   │   │   │               └── route.ts
│   │   ├── sports/
│   │   │   └── [sportSlug]/
│   │   │       ├── teams/
│   │   │       │   ├── page.tsx          # Page listant les équipes d'un sport
│   │   │       │   └── [teamSlug]/
│   │   │       │       └── page.tsx      # Page de profil dynamique d'une équipe (ex: football)
│   │   │       └── ...                   # Autres pages spécifiques au sport (ex: drivers, circuits pour F1)
│   │   ├── globals.css       # Styles globaux et variables de thèmes ShadCN
│   │   ├── layout.tsx        # Layout principal de l'application
│   │   └── page.tsx          # Page d'accueil (sélection du sport)
│   ├── actions/              # Server Actions (logique backend pour formulaires, etc.)
│   │   ├── auth.ts           # Actions pour l'authentification
│   │   └── bets.ts           # Actions pour la gestion des paris
│   ├── ai/                   # Logique liée à l'IA (Genkit)
│   │   ├── flows/            # Définitions des flows Genkit
│   │   │   └── team-info-flow.ts # Flow pour obtenir des infos sur les équipes (générique)
│   │   ├── dev.ts            # Configuration pour le dev server Genkit
│   │   └── genkit.ts         # Initialisation et configuration de Genkit
│   ├── components/           # Composants React réutilisables
│   │   ├── ui/               # Composants ShadCN UI (ne pas modifier directement)
│   │   ├── BettingModal.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── MatchCard.tsx     # Spécifique au football pour l'instant
│   │   └── TeamBannerCard.tsx # Pourrait être généralisé
│   ├── context/              # Contextes React pour la gestion d'état global
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/                # Hooks React personnalisés
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   ├── lib/                  # Utilitaires, types, et logique partagée
│   │   ├── db.ts             # Interaction avec la base de données SQLite
│   │   ├── dateUtils.ts      # Fonctions utilitaires pour les dates
│   │   ├── mockData.ts       # Données fictives (sports supportés, équipes initiales pour le foot)
│   │   ├── types.ts          # Définitions TypeScript des types et interfaces
│   │   └── utils.ts          # Fonctions utilitaires générales (ex: cn pour classnames)
│   └── services/             # Services pour interagir avec des API externes
│       └── apiSportsService.ts # Logique pour appeler les API api-sports.io (football, F1, etc.)
├── public/                 # Fichiers statiques (images, etc.)
├── .env                    # Fichier pour les variables d'environnement (NON VERSIONNÉ)
├── components.json         # Configuration ShadCN UI
├── next.config.ts          # Configuration de Next.js
├── package.json            # Dépendances et scripts du projet
└── tsconfig.json           # Configuration TypeScript
```

## Concepts Clés et Modification du Code

### Pages et Routage (Next.js App Router)

*   La page d'accueil (`src/app/page.tsx`) permet de sélectionner un sport.
*   Les pages relatives à un sport sont dans `src/app/sports/[sportSlug]/`.
    *   Par exemple, `src/app/sports/football/teams/page.tsx` liste les équipes de football.
    *   `src/app/sports/football/teams/[teamSlug]/page.tsx` affiche le profil d'une équipe de football.
*   Pour ajouter une nouvelle page (ex: classement d'un sport), créez un nouveau dossier/fichier `page.tsx` dans la structure `sports/[sportSlug]/`.

### Composants React (ShadCN UI)

*   Les composants réutilisables sont dans `src/components/`.
*   Les composants d'interface utilisateur de base proviennent de **ShadCN UI**. Ils sont installés dans `src/components/ui/`. **Il est généralement déconseillé de modifier directement ces fichiers `ui/`**. Préférez créer vos propres composants qui utilisent ceux de ShadCN.
*   Utilisez des props pour rendre les composants configurables et réutilisables.

### Styling (Tailwind CSS & Thèmes)

*   **Tailwind CSS** est utilisé pour le styling utilitaire.
*   **ShadCN UI** est configuré avec des variables CSS pour les thèmes dans `src/app/globals.css`.
*   Modifiez les variables HSL dans `:root` (thème clair) et `.dark` (thème sombre) pour changer les couleurs principales. D'autres thèmes (`.theme-blue`, etc.) sont aussi définis.

### Logique Côté Serveur (Server Actions)

*   Situées dans `src/actions/`, elles gèrent les mutations de données (ex: login, paris).
*   Elles sont marquées avec `'use server';` et doivent être `async`.

### Base de Données (SQLite)

*   Stocke les utilisateurs, paris, etc. dans `db/app.db`.
*   Les interactions sont gérées dans `src/lib/db.ts`. Pour modifier le schéma, ajustez `initializeDb`.

### Intégration API Externe (API-Sports)

*   Toutes les requêtes vers les API `api-sports.io` (pour le football, F1, etc.) sont gérées dans `src/services/apiSportsService.ts`.
*   Ce fichier contient :
    *   Une fonction `fetchDataForSport` pour gérer l'authentification et les appels de base à n'importe quelle API `api-sports.io` (en passant l'URL de base du sport).
    *   Des fonctions spécifiques pour chaque sport et endpoint (ex: `getFootballTeamDetails`, `getFootballMatchesForTeam`).
    *   Des fonctions de mapping pour transformer les réponses brutes de l'API en types de données utilisés par l'application (`TeamApp`, `MatchApp`, etc.).
*   **Attention aux quotas API !** Le plan gratuit est limité (ex: 100 requêtes/jour par API). Optimisez les appels et utilisez le cache de Next.js.

### Fonctionnalités IA (Genkit)

*   Utilisé pour les résumés d'équipes (principalement football pour l'instant).
*   Configuration dans `src/ai/genkit.ts`. Flows dans `src/ai/flows/`.
*   Le flow `team-info-flow.ts` est conçu pour être adaptable à différentes entités sportives, pas seulement les équipes de foot. Il supporte maintenant le Markdown pour la mise en forme des réponses.

### Gestion de l'État (Context API)

*   `src/context/AuthContext.tsx` : Utilisateur authentifié.
*   `src/context/ThemeContext.tsx` : Thème visuel (clair/sombre, couleurs).

### Données Fictives (Mock Data)

*   `src/lib/mockData.ts` contient :
    *   `supportedSports`: Une liste des sports que l'application vise à supporter, avec leur nom, slug, URL de base API, et une icône.
    *   `footballTeams`: Données statiques pour les équipes de football, **incluant leur ID réel de l'API-Sports**, crucial pour faire le lien avec les données dynamiques.
    *   `footballLeagues`: Données statiques pour quelques ligues de football.
*   Pour ajouter une nouvelle équipe de football à afficher sur la page `/sports/football/teams`, ajoutez-la à `footballTeams` avec son ID API-Sports correct et une URL de logo.
*   Pour supporter un nouveau sport, ajoutez-le à `supportedSports` et créez les pages et services nécessaires.

## API Publique

L'application expose une API publique en lecture seule pour accéder à certaines de ses données.

**URL de base :** `/api`

### Endpoints disponibles :

1.  **Lister tous les sports supportés**
    *   **Endpoint :** `GET /api/sports`
    *   **Description :** Retourne la liste de tous les sports configurés dans l'application.
    *   **Exemple de réponse :**
        ```json
        [
          {
            "name": "Football",
            "slug": "football",
            "apiBaseUrl": "https://v3.football.api-sports.io",
            "apiKeyHeaderName": "x-apisports-key",
            "apiKeyEnvVar": "API_SPORTS_KEY_FOOTBALL",
            "iconUrl": "https://media.api-sports.io/football/leagues/39.png"
          },
          // ... autres sports
        ]
        ```

2.  **Lister les équipes pour un sport spécifique**
    *   **Endpoint :** `GET /api/sports/{sportSlug}/teams`
    *   **Paramètres d'URL :**
        *   `sportSlug` (string, requis) : Le slug du sport (ex: "football").
    *   **Description :** Retourne la liste des équipes pour le sport spécifié. Actuellement, seules les équipes de football sont entièrement supportées.
    *   **Exemple de réponse (pour football) :**
        ```json
        [
          {
            "id": 33,
            "name": "Manchester United",
            "logoUrl": "https://media.api-sports.io/football/teams/33.png",
            "slug": "manchester-united",
            "sportSlug": "football"
            // ... autres champs de TeamApp
          },
          // ... autres équipes
        ]
        ```

3.  **Obtenir les détails d'une équipe de football**
    *   **Endpoint :** `GET /api/sports/football/teams/{teamSlug}`
    *   **Paramètres d'URL :**
        *   `teamSlug` (string, requis) : Le slug de l'équipe de football (ex: "manchester-united").
    *   **Description :** Retourne des informations détaillées sur une équipe de football, y compris les détails de l'équipe, les 10 derniers matchs passés, l'entraîneur actuel, l'effectif et un résumé généré par l'IA.
    *   **Exemple de réponse (structure) :**
        ```json
        {
          "teamDetails": { /* ... objet TeamApp ... */ },
          "pastMatches": [ /* ... tableau d'objets MatchApp ... */ ],
          "coach": { /* ... objet CoachApp ou null ... */ },
          "squad": [ /* ... tableau d'objets PlayerApp ... */ ],
          "aiSummary": "Résumé textuel de l'IA sur l'équipe..."
        }
        ```

**Notes importantes sur l'API :**
*   L'API est actuellement en lecture seule.
*   Les données pour les sports autres que le football sont limitées ou non implémentées.
*   L'utilisation de l'API peut être soumise aux mêmes limitations de quota que l'application principale, car certains endpoints appellent des API externes (API-Sports).

## Clés API

*   Une clé API unique pour **API-Sports** (valable pour le football, F1, basketball, etc. du même fournisseur) doit être configurée dans `.env` :
    ```env
    API_SPORTS_KEY=VOTRE_CLE_API_SPORTS_ICI
    ```
*   Le plan gratuit d'API-Sports a des limitations (actuellement 100 requêtes/jour par API et accès limité aux données historiques/futures).

## Qualité du Code

*   **TypeScript:** Pour la robustesse.
*   **Organisation:** Gardez les fichiers organisés et les composants ciblés.
*   **Commentaires:** Expliquez la logique complexe.

## Dépannage

*   **Erreurs API (429 Too Many Requests) :** Dépassement du quota. Attendez ou vérifiez votre dashboard API-Sports.
*   **Problèmes de Build Next.js :** Lisez les erreurs (types, imports, Server Actions/Components).
*   **Hydration Mismatches (React) :** Différence entre rendu serveur et client. Utilisez `useEffect` pour le code dépendant du navigateur.
*   **Données non affichées pour une saison :** L'API-Sports (plan gratuit) a des restrictions sur les saisons. Pour le football, la constante pour les matchs est réglée sur une saison supportée (ex: 2023 pour la saison 2023-2024).

## Contribuer et Étendre à d'Autres Sports

L'application est conçue pour être extensible à d'autres sports. Voici les étapes générales pour ajouter un nouveau sport (ex: Formule 1) :

1.  **Ajouter le Sport à `mockData.ts` :**
    *   Modifiez le tableau `supportedSports` dans `src/lib/mockData.ts` pour inclure le nouveau sport, son `slug`, l'URL de base de son API `api-sports.io` (ex: `https://v1.formula-1.api-sports.io`), et une URL d'icône.

2.  **Définir les Types (`src/lib/types.ts`) :**
    *   Créez des interfaces pour les entités principales du nouveau sport (ex: `DriverF1App`, `ConstructorF1App`, `RaceF1App`).
    *   Créez des interfaces pour les réponses API spécifiques à ce sport si elles diffèrent grandement de celles du football.

3.  **Étendre le Service API (`src/services/apiSportsService.ts`) :**
    *   Ajoutez de nouvelles fonctions pour récupérer les données du nouveau sport (ex: `getF1Drivers()`, `getF1Races()`). Ces fonctions utiliseront `fetchDataForSport` en passant l'URL de base de l'API du sport concerné.
    *   Créez des fonctions de mapping pour transformer les données brutes de l'API en vos types `...App`.

4.  **Créer les Pages de Routage :**
    *   Créez un dossier pour le nouveau sport dans `src/app/sports/`, par exemple `src/app/sports/formula-1/`.
    *   Ajoutez une page pour lister les entités principales (ex: `src/app/sports/formula-1/drivers/page.tsx`). Cette page utilisera les nouvelles fonctions du service API.
    *   Ajoutez des pages de détail si nécessaire (ex: `src/app/sports/formula-1/drivers/[driverSlug]/page.tsx`).

5.  **Créer des Composants UI :**
    *   Développez de nouveaux composants React pour afficher les données spécifiques au nouveau sport (ex: `DriverCardF1.tsx`, `RaceScheduleF1.tsx`).
    *   Utilisez les composants ShadCN UI pour une apparence cohérente.

6.  **Mettre à Jour `mockData.ts` (optionnel) :**
    *   Si vous souhaitez afficher des données initiales statiques pour le nouveau sport (comme les équipes de football), ajoutez-les à `mockData.ts` avec leurs ID API réels.

7.  **Adapter l'IA (optionnel) :**
    *   Si vous souhaitez que l'IA fournisse des informations sur le nouveau sport, vous devrez peut-être ajuster les prompts dans `src/ai/flows/` ou créer de nouveaux flows. Le flow `team-info-flow.ts` est assez générique et pourrait être utilisé en passant le nom d'un pilote de F1, par exemple.

N'hésitez pas à poser des questions si vous êtes bloqué !
---

Ce README devrait fournir une bonne base pour les nouveaux contributeurs. N'hésitez pas à le mettre à jour au fur et à mesure de l'évolution du projet !
