# FootySchedule - Application de Suivi de Matchs de Football

Bienvenue sur FootySchedule ! Cette application Next.js vous permet de consulter les informations des équipes de football, leurs matchs passés, et d'obtenir des résumés et réponses à vos questions grâce à l'IA.

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
7.  [Clés API](#clés-api)
8.  [Qualité du Code](#qualité-du-code)
9.  [Dépannage](#dépannage)

## Aperçu du Projet

FootySchedule a pour objectif principal de permettre aux utilisateurs de :
*   Parcourir une liste d'équipes de football.
*   Consulter la page de profil détaillée de chaque équipe.
*   Voir les matchs passés d'une équipe.
*   Interagir avec un assistant IA pour obtenir des résumés et des réponses à des questions spécifiques sur les équipes.
*   (Fonctionnalités futures potentielles : paris, watchlist plus avancée, etc.)

## Stack Technique

*   **Framework Frontend:** [Next.js](https://nextjs.org/) (avec App Router)
*   **Librairie UI:** [React](https://reactjs.org/)
*   **Composants UI:** [ShadCN UI](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Fonctionnalités IA:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
*   **API de Données Football:** [API-Football (api-sports.io)](https://www.api-football.com/)
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
    Créez un fichier `.env` à la racine du projet et ajoutez-y votre clé API pour API-Sports :
    ```env
    API_SPORTS_KEY=VOTRE_CLE_API_SPORTS_ICI
    ```
    Vous pouvez obtenir une clé API gratuite sur [api-football.com](https://dashboard.api-football.com/register). Le plan gratuit a des limitations (ex: 100 requêtes/jour, accès limité aux saisons récentes).

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
│   │   ├── team/
│   │   │   └── [teamSlug]/   # Page de profil dynamique d'une équipe
│   │   ├── globals.css       # Styles globaux et variables de thèmes ShadCN
│   │   ├── layout.tsx        # Layout principal de l'application
│   │   └── page.tsx          # Page d'accueil
│   ├── actions/              # Server Actions (logique backend pour formulaires, etc.)
│   │   ├── auth.ts           # Actions pour l'authentification
│   │   └── bets.ts           # Actions pour la gestion des paris (si implémenté)
│   ├── ai/                   # Logique liée à l'IA (Genkit)
│   │   ├── flows/            # Définitions des flows Genkit
│   │   │   └── team-info-flow.ts # Flow pour obtenir des infos sur les équipes
│   │   ├── dev.ts            # Configuration pour le dev server Genkit
│   │   └── genkit.ts         # Initialisation et configuration de Genkit
│   ├── components/           # Composants React réutilisables
│   │   ├── ui/               # Composants ShadCN UI (ne pas modifier directement)
│   │   ├── BettingModal.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── MatchCard.tsx
│   │   └── TeamBannerCard.tsx
│   ├── context/              # Contextes React pour la gestion d'état global
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/                # Hooks React personnalisés
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   ├── lib/                  # Utilitaires, types, et logique partagée
│   │   ├── db.ts             # Interaction avec la base de données SQLite
│   │   ├── dateUtils.ts      # Fonctions utilitaires pour les dates
│   │   ├── mockData.ts       # Données fictives (utilisées pour la liste d'équipes initiale)
│   │   ├── types.ts          # Définitions TypeScript des types et interfaces
│   │   └── utils.ts          # Fonctions utilitaires générales (ex: cn pour classnames)
│   └── services/             # Services pour interagir avec des API externes
│       └── apiSportsService.ts # Logique pour appeler l'API-Football (api-sports.io)
├── public/                 # Fichiers statiques (images, etc.)
├── .env                    # Fichier pour les variables d'environnement (NON VERSIONNÉ)
├── components.json         # Configuration ShadCN UI
├── next.config.ts          # Configuration de Next.js
├── package.json            # Dépendances et scripts du projet
└── tsconfig.json           # Configuration TypeScript
```

## Concepts Clés et Modification du Code

### Pages et Routage (Next.js App Router)

*   Les pages sont situées dans `src/app/`. Chaque dossier représente un segment de route.
*   Un fichier `page.tsx` dans un dossier définit l'interface utilisateur pour cette route.
*   Les routes dynamiques utilisent des crochets, ex: `src/app/team/[teamSlug]/page.tsx` pour `monsite.com/team/nom-de-lequipe`.
*   Le fichier `src/app/layout.tsx` définit la structure HTML de base pour toutes les pages.

**Pour ajouter une nouvelle page :**
1.  Créez un nouveau dossier dans `src/app/` (ex: `src/app/nouvelle-page/`).
2.  Ajoutez un fichier `page.tsx` dans ce dossier avec votre composant React.

### Composants React (ShadCN UI)

*   Les composants réutilisables sont dans `src/components/`.
*   Les composants d'interface utilisateur de base proviennent de **ShadCN UI**. Ils sont installés dans `src/components/ui/`. **Il est généralement déconseillé de modifier directement ces fichiers `ui/`**. Préférez créer vos propres composants qui utilisent ceux de ShadCN.
*   Utilisez des props pour rendre les composants configurables et réutilisables.

**Pour créer un nouveau composant :**
1.  Créez un fichier `.tsx` dans `src/components/` (ex: `MonNouveauComposant.tsx`).
2.  Définissez votre composant fonctionnel React.
3.  Importez et utilisez-le dans vos pages ou d'autres composants.

### Styling (Tailwind CSS & Thèmes)

*   **Tailwind CSS** est utilisé pour le styling utilitaire. Appliquez les classes directement dans votre JSX.
*   **ShadCN UI** est configuré pour utiliser des variables CSS pour les thèmes. Ces variables sont définies dans `src/app/globals.css`.
*   Pour changer les couleurs primaires, d'accent, de fond, etc., modifiez les variables HSL dans `:root` (thème clair par défaut) et `.dark` (thème sombre par défaut) dans `globals.css`.
*   Des thèmes supplémentaires (ex: `.theme-blue`) sont également définis dans `globals.css` et gérés par `ThemeContext`.

### Logique Côté Serveur (Server Actions)

*   Les Server Actions permettent d'exécuter du code côté serveur directement depuis des composants client, sans avoir à créer des routes API manuelles pour les mutations de données (ex: soumission de formulaires).
*   Elles sont définies dans des fichiers avec la directive `'use server';` au début (ex: `src/actions/auth.ts`).
*   Les fonctions exportées de ces fichiers doivent être `async`.
*   Elles peuvent être appelées depuis des formulaires (`<form action={serverAction}>`) ou directement en JavaScript.

### Base de Données (SQLite)

*   Le projet utilise SQLite pour la persistance des données (utilisateurs, paris, etc.).
*   Le fichier de base de données est `db/app.db`.
*   Toutes les interactions avec la base de données sont gérées dans `src/lib/db.ts`. Ce fichier contient :
    *   La connexion à la base de données.
    *   L'initialisation du schéma (création des tables si elles n'existent pas).
    *   Des fonctions pour lire et écrire des données (ex: `findUserByEmail`, `createUser`, `createBetDb`).
*   Pour modifier le schéma, ajoutez de nouvelles instructions `CREATE TABLE` ou `ALTER TABLE` dans la fonction `initializeDb`.

### Intégration API Externe (API-Sports)

*   Toutes les requêtes vers l'API-Football (api-sports.io) sont gérées dans `src/services/apiSportsService.ts`.
*   Ce fichier contient :
    *   Une fonction `fetchFromApiSports` pour gérer l'authentification et les appels de base.
    *   Des fonctions spécifiques pour chaque endpoint de l'API utilisé (ex: `getApiSportsTeamDetails`, `getApiSportsMatchesForTeam`).
    *   Des fonctions de mapping pour transformer les réponses brutes de l'API en types de données utilisés par l'application (`TeamApp`, `MatchApp`).
*   **Attention aux quotas API !** Le plan gratuit est limité (ex: 100 requêtes/jour). Optimisez les appels et utilisez le cache de Next.js (via l'option `revalidate` dans `fetch`).

### Fonctionnalités IA (Genkit)

*   Genkit est utilisé pour les fonctionnalités d'intelligence artificielle, comme la génération de résumés d'équipes.
*   **Configuration :** L'initialisation de Genkit et la configuration du modèle (ex: Gemini) se trouvent dans `src/ai/genkit.ts`.
*   **Flows :** La logique principale de l'IA est définie dans des "Flows". Un flow est une fonction qui peut appeler des modèles d'IA, des prompts, etc. Voir `src/ai/flows/team-info-flow.ts` pour un exemple.
    *   Un flow définit généralement des schémas d'entrée et de sortie avec Zod (`inputSchema`, `outputSchema`).
*   **Prompts :** Les prompts pour les modèles LLM sont définis avec `ai.definePrompt`. Ils peuvent utiliser la syntaxe Handlebars (`{{{ }}}`) pour injecter des données d'entrée.
    *   Il est important d'instruire l'IA sur le format de sortie désiré (ex: utiliser Markdown).
*   **Utilisation dans l'application :** Les flows exportés peuvent être appelés directement depuis des Server Actions ou des composants serveur.

### Gestion de l'État (Context API)

*   Pour l'état global partagé entre plusieurs composants :
    *   `src/context/AuthContext.tsx` : Gère l'état de l'utilisateur authentifié (informations de l'utilisateur, chargement, fonctions `login`/`logout`). Les données utilisateur sont persistées dans `localStorage`.
    *   `src/context/ThemeContext.tsx` : Gère le thème visuel (ex: "default", "blue") et le mode (clair/sombre/système) de l'application. Les préférences sont persistées dans `localStorage`.

### Données Fictives (Mock Data)

*   `src/lib/mockData.ts` contient des données statiques pour les équipes et les ligues.
*   Ces données sont principalement utilisées pour :
    *   Peupler la liste des équipes sur la page d'accueil.
    *   Fournir les **ID réels de l'API-Sports** pour chaque équipe, ce qui permet de faire le lien entre la sélection d'une équipe et la récupération de ses données réelles via l'API.
    *   Fournir des URLs de logo par défaut ou de secours.
*   Si vous ajoutez une nouvelle équipe à afficher sur la page d'accueil, vous devez l'ajouter à ce fichier avec son ID API-Sports correct et une URL de logo.

## Clés API

*   La clé API pour **API-Sports** doit être configurée dans le fichier `.env` à la racine du projet :
    ```env
    API_SPORTS_KEY=VOTRE_CLE_API_SPORTS_ICI
    ```
*   Le plan gratuit d'API-Sports a des limitations (actuellement 100 requêtes/jour et accès limité aux données historiques/futures pour certaines saisons). Soyez conscient de ces limites pendant le développement.

## Qualité du Code

*   **TypeScript:** Utilisez TypeScript pour améliorer la robustesse et la maintenabilité du code.
*   **Linting & Formatage:** (Configurer Prettier et ESLint si ce n'est pas déjà fait)
    *   `npm run lint` (si script configuré)
    *   `npm run typecheck` (pour vérifier les erreurs TypeScript)
*   **Organisation:** Essayez de garder les fichiers bien organisés et les composants petits et ciblés.
*   **Commentaires:** Ajoutez des commentaires lorsque la logique n'est pas évidente.

## Dépannage

*   **Erreurs API (429 Too Many Requests) :** Vous avez probablement dépassé votre quota de requêtes API. Attendez la période de réinitialisation ou vérifiez votre tableau de bord API-Sports.
*   **Problèmes de Build Next.js :** Lisez attentivement les messages d'erreur. Souvent, ils indiquent des problèmes de type, d'importation, ou de configuration de Server Actions/Components.
*   **Hydration Mismatches (React) :** Si vous voyez des erreurs d'hydratation, cela signifie que le rendu initial côté serveur diffère du premier rendu côté client. Cela arrive souvent avec du contenu dynamique qui dépend d'API navigateur (ex: `window`, `localStorage`, `Math.random()`, `new Date()`). Utilisez `useEffect` pour exécuter ce code uniquement côté client.
*   **Données non affichées pour une saison :** L'API-Sports (plan gratuit) a des restrictions sur les saisons accessibles. Assurez-vous que la constante `CURRENT_SEASON` dans `src/services/apiSportsService.ts` est réglée sur une saison supportée (ex: 2023 pour la saison 2023-2024).

---

Ce README devrait fournir une bonne base pour les nouveaux contributeurs. N'hésitez pas à le mettre à jour au fur et à mesure de l'évolution du projet !
