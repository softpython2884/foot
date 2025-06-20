
# Présentation : SportSphere - Votre Compagnon Sportif Ultime

---

## 1. Introduction : Qu'est-ce que SportSphere ?

*   **Concept :** Une application web centralisée pour les passionnés de sport.
*   **Objectif :** Fournir des informations complètes sur les équipes, les matchs, et offrir une expérience interactive grâce à l'IA et à un système de paris ludique.
*   **Vision :** Commencer avec le Football, puis s'étendre à d'autres sports majeurs comme la Formule 1, le Basketball, etc.

---

## 2. Fonctionnalités Clés

*   **Sélection de Sport :**
    *   Interface claire pour choisir un sport.
    *   Navigation intuitive vers les informations spécifiques au sport sélectionné.

*   **Informations sur les Équipes/Entités :**
    *   Pages de profil détaillées (ex: équipes de Football, écuries de F1, équipes de Basketball).
    *   Affichage des logos, noms, et informations de base.
    *   (Pour le Football) : Coach actuel, effectif.
    *   (Pour la F1) : Directeur, manager technique, châssis, moteur, détails du constructeur.
    *   (Pour le Basketball) : Conférence, division.

*   **Informations sur les Matchs/Événements :**
    *   (Pour le Football) : Affichage des matchs passés avec scores (multiples saisons).
    *   (Pour la F1) : Résultats des courses récentes pour l'écurie sélectionnée.
    *   (Pour le Basketball) : Résultats des matchs récents avec scores par quart-temps.
    *   **Événements Managés (Custom Events) :**
        *   Création et gestion d'événements par un administrateur.
        *   Mise à jour des scores, statuts (upcoming, live, paused, finished, cancelled) en temps réel.
        *   Affichage des événements managés sur les pages des sports et des équipes. Les événements "finished" et "cancelled" restent visibles.

*   **Assistant IA Intégré (Genkit) :**
    *   Obtention de résumés générés par IA sur les équipes/entités sportives.
    *   Possibilité de poser des questions spécifiques à l'IA pour des réponses contextuelles.
    *   Biographies de joueurs/pilotes générées par l'IA sur demande.

*   **Système de Paris (Ludique) :**
    *   Les utilisateurs démarrent avec un solde de 10 points.
    *   Possibilité de parier sur des événements managés (statuts: upcoming, live, paused).
    *   Les paris sont réglés automatiquement lorsque l'événement managé est marqué comme "finished" (calcul du gagnant basé sur les scores).
    *   Classement des utilisateurs basé sur leur score.
    *   Option pour les utilisateurs d'obtenir gratuitement 100 points supplémentaires si leur solde est à zéro.

*   **Personnalisation :**
    *   Choix de thèmes de couleurs (Défaut, Bleu, Rose, Orange).
    *   Mode d'affichage clair/sombre/système.

---

## 3. Stack Technique

*   **Framework Frontend :** Next.js (App Router), React, TypeScript
*   **Librairie UI & Styling :** ShadCN UI, Tailwind CSS
*   **Intelligence Artificielle :** Google AI - Genkit (avec Gemini 1.5 Flash)
*   **Base de Données :** SQLite (via `sqlite` et `sqlite3`)
*   **API de Données Sportives :** API-Sports (pour Football, F1, Basketball)
*   **Authentification :** Système personnalisé avec `bcrypt` pour le hachage des mots de passe.
*   **Déploiement (potentiel) :** Firebase App Hosting

---

## 4. Architecture & Concepts Clés (Vue d'Ensemble)

*   **Server Components & Server Actions (Next.js) :** Pour une logique backend optimisée et des mutations de données sécurisées directement depuis les composants.
*   **Context API (React) :** Pour la gestion de l'état global (utilisateur authentifié, thème visuel).
*   **Service API Centralisé :** `apiSportsService.ts` pour une gestion unifiée des appels aux API externes de données sportives.
*   **Base de Données Locale :** Schéma SQLite pour stocker les utilisateurs, les événements managés personnalisés, et les paris.
*   **Routage Dynamique :** Structure de dossiers intuitive dans `src/app/sports/[sportSlug]/...` pour gérer les différentes pages par sport et par équipe/entité.
*   **Sécurité & Validation :** Utilisation de Zod pour la validation des données des formulaires et des actions serveur.

---

## 5. Présentation Technique Détaillée

### 5.1. Frontend (Next.js & React)

*   **App Router & Server Components (RSC) :**
    *   L'application utilise le **App Router** de Next.js pour une organisation des routes basée sur les dossiers.
    *   Par défaut, les pages sont des **Server Components**. Cela signifie que le rendu initial se fait côté serveur, réduisant la quantité de JavaScript envoyée au client et améliorant les performances de chargement.
    *   Les RSC peuvent directement accéder à des sources de données backend (comme la base de données ou les API externes via les services).
    *   Exemple : `src/app/sports/[sportSlug]/teams/[teamSlug]/page.tsx` récupère les données de l'équipe et les affiche directement.

*   **Client Components & Interactivité :**
    *   Pour les fonctionnalités interactives (gestion d'état local, écouteurs d'événements, hooks comme `useState`, `useEffect`), nous utilisons des **Client Components**.
    *   Ils sont identifiés par la directive `'use client';` en haut du fichier.
    *   Exemples : Le `Header.tsx` pour gérer le menu déroulant utilisateur, les formulaires de connexion/inscription (`src/app/login/page.tsx`), la `BettingModal.tsx`.

*   **Styling avec ShadCN UI & Tailwind CSS :**
    *   **ShadCN UI** fournit une collection de composants d'interface utilisateur réutilisables, beaux et accessibles (boutons, cartes, formulaires, etc.). Ils sont copiés dans `src/components/ui/` et peuvent être personnalisés.
    *   **Tailwind CSS** est utilisé pour le styling utilitaire. Les classes Tailwind sont appliquées directement dans le JSX pour un développement rapide et une grande flexibilité.
    *   Les **thèmes de couleurs** et le mode clair/sombre sont gérés via des variables CSS HSL dans `src/app/globals.css` et contrôlés par `ThemeContext.tsx`.

*   **Gestion de l'État (Context API) :**
    *   `AuthContext.tsx` : Gère l'état de l'utilisateur authentifié (informations de l'utilisateur, état de chargement, fonctions de connexion/déconnexion). Il utilise `localStorage` pour la persistance de la session côté client.
    *   `ThemeContext.tsx` : Gère le thème de couleur actif et le mode d'affichage (clair/sombre/système). Il utilise également `localStorage` pour sauvegarder les préférences de l'utilisateur.

### 5.2. Backend & Données

*   **Server Actions (Next.js) :**
    *   Utilisées pour la logique backend qui modifie des données (mutations). Elles sont définies dans `src/actions/`.
    *   Marquées avec `'use server';`, elles peuvent être appelées directement depuis des Client Components (typiquement des formulaires).
    *   Elles s'exécutent côté serveur, offrant une sécurité accrue et un accès direct à la base de données.
    *   Exemples : `auth.ts` (login, register), `bets.ts` (placer un pari), `adminEvents.ts` (créer/modifier un événement).
    *   La validation des données d'entrée est effectuée avec **Zod**.

*   **Base de Données SQLite (`src/lib/db.ts`) :**
    *   Une base de données SQLite locale (`db/app.db`) est utilisée pour stocker :
        *   `users` : Informations utilisateurs (nom, email, mot de passe haché, score).
        *   `managed_events` : Événements créés par l'administrateur (nom, sport, équipes, scores, statut, etc.).
        *   `bets` : Paris placés par les utilisateurs sur les événements managés.
    *   `src/lib/db.ts` gère l'initialisation de la base de données (création des tables si elles n'existent pas) et fournit des fonctions pour interagir avec ces tables (CRUD).

*   **Service API Externe (`src/services/apiSportsService.ts`) :**
    *   Centralise tous les appels à l'API externe (API-Sports).
    *   Contient une fonction générique `fetchDataForSport` pour gérer l'authentification et la requête de base.
    *   Fournit des fonctions spécifiques pour chaque endpoint de sport (ex: `getFootballTeamDetails`, `getF1ConstructorDetails`, `getBasketballGamesForTeam`).
    *   Inclut des fonctions de **mapping** pour transformer les réponses brutes de l'API en types de données structurés utilisés par l'application (ex: `TeamApp`, `MatchApp`).
    *   Gère la clé API via des variables d'environnement (`process.env.API_SPORTS_KEY`).
    *   **Attention** : Le plan gratuit d'API-Sports a des limitations de requêtes. Les données sont mises en cache par Next.js pendant 1 heure (configurable).

### 5.3. Intelligence Artificielle (Genkit & Gemini)

*   **Genkit** est utilisé comme toolkit pour interagir avec les modèles d'IA de Google (Gemini).
*   L'initialisation de Genkit et la configuration du modèle (Gemini 1.5 Flash) se trouvent dans `src/ai/genkit.ts`.
*   **Flow `team-info-flow.ts` (`src/ai/flows/`) :**
    *   Définit un flow Genkit (`teamInfoFlow`) et un prompt (`teamInfoPrompt`) pour générer des informations sur une entité sportive.
    *   Prend en entrée le nom de l'entité, son type (équipe, joueur), un contexte optionnel (ex: équipe pour un joueur), et une question optionnelle.
    *   Le **prompt** est formulé en français et utilise la syntaxe Handlebars pour insérer dynamiquement les entrées. Il instruit l'IA de fournir des résumés généraux, des biographies de joueurs, ou des réponses spécifiques à des questions, en utilisant le format Markdown.
    *   Utilisé sur les pages de profil d'équipe/entité pour afficher un résumé et permettre à l'utilisateur de poser des questions.

### 5.4. Système d'Authentification Personnalisé

*   Géré par `src/actions/auth.ts` (Server Actions) et `AuthContext.tsx` (Client-side).
*   Les mots de passe sont hachés avec **bcrypt** avant d'être stockés dans la base de données.
*   La connexion vérifie l'email et compare le mot de passe fourni avec le hachage stocké.
*   Une fois connecté, les informations de l'utilisateur (sans le mot de passe haché) sont stockées dans `AuthContext` et `localStorage`.

### 5.5. Système de Paris & Événements Managés

*   **Événements Managés :**
    *   L'administrateur peut créer et gérer des événements via la page `/admin`.
    *   Les événements sont stockés dans la table `managed_events` de la base de données.
    *   L'admin peut mettre à jour le statut (upcoming, live, paused, finished, cancelled), les scores, et le temps écoulé.
    *   L'API `/api/admin/events` récupère tous les événements pour l'admin.
    *   L'API `/api/sport-events/[sportSlug]` récupère les événements pour un sport donné, avec des filtres de statut et d'équipe, pour l'affichage client.

*   **Paris :**
    *   Les utilisateurs peuvent parier sur les événements managés dont le statut est 'upcoming', 'live', ou 'paused'.
    *   L'action `placeBetAction` (`src/actions/bets.ts`) :
        *   Vérifie si l'utilisateur a suffisamment de points.
        *   Enregistre le pari dans la table `bets`.
        *   Déduit le montant parié du score de l'utilisateur.
    *   **Règlement des Paris :**
        *   Lorsque l'admin marque un événement managé comme 'finished' via `updateManagedEventAction` (`src/actions/adminEvents.ts`), l'action appelle `settleBetsForManagedEvent`.
        *   `settleBetsForManagedEvent` (`src/actions/bets.ts`) :
            *   Récupère l'événement managé et son équipe gagnante (ou match nul).
            *   Récupère tous les paris 'pending' pour cet événement.
            *   Met à jour le statut de chaque pari (won/lost) et ajuste le score de l'utilisateur en conséquence (ajoute les gains si le pari est gagné).

### 5.6. Structure du Projet (Rappel Technique)

*   `src/app/` : Cœur de l'application Next.js App Router.
    *   `api/` : Routes API pour la communication client-serveur (ex: `/api/admin/events`).
    *   `sports/[sportSlug]/teams/[teamSlug]/page.tsx` : Pages dynamiques pour les profils d'équipe.
    *   `admin/` : Interface d'administration.
*   `src/actions/` : Server Actions pour la logique backend.
*   `src/ai/` : Logique Genkit pour l'IA.
*   `src/components/` : Composants React réutilisables (y compris `ui/` de ShadCN).
*   `src/context/` : Contextes React pour la gestion d'état.
*   `src/lib/` : Utilitaires, types, `db.ts` (DB), `mockData.ts`.
*   `src/services/` : `apiSportsService.ts` pour les API externes.

---

## 6. Flux de Données Typiques

### 6.1. Affichage d'une Page de Profil d'Équipe (ex: Football)

1.  L'utilisateur navigue vers `/sports/football/teams/real-madrid`.
2.  Next.js route vers `src/app/sports/football/teams/[teamSlug]/page.tsx`.
3.  Le Server Component de la page extrait `teamSlug` ("real-madrid") des paramètres.
4.  Il trouve l'ID de l'équipe "Real Madrid" dans `mockData.ts`.
5.  Il appelle les fonctions de `apiSportsService.ts` (ex: `getFootballTeamDetails`, `getFootballMatchesForTeam`) et le flow Genkit `getTeamInfo`.
6.  Ces services/flows peuvent appeler l'API externe (API-Sports) ou le modèle d'IA.
7.  Les données récupérées (détails de l'équipe, matchs, résumé IA) sont passées comme props aux sous-composants.
8.  La page est rendue côté serveur et envoyée au client.
9.  Si l'utilisateur pose une question à l'IA (Client Component), cela déclenche un appel au Server Action qui exécute le flow Genkit et renvoie la réponse.

### 6.2. Processus de Pari sur un Événement Managé

1.  L'utilisateur, connecté, est sur une page affichant un événement managé "upcoming".
2.  Il clique sur "Parier sur Équipe A".
3.  La `BettingModal.tsx` (Client Component) s'ouvre.
4.  L'utilisateur saisit un montant et soumet le formulaire.
5.  La modale appelle la Server Action `placeBetAction` (`src/actions/bets.ts`) avec les détails du pari.
6.  `placeBetAction` :
    *   Valide les données avec Zod.
    *   Vérifie le score de l'utilisateur (via `getUserById` depuis `db.ts`).
    *   Crée une nouvelle entrée dans la table `bets` (via `createBetDb`).
    *   Met à jour le score de l'utilisateur (via `updateUserScoreDb`).
    *   Appelle `revalidatePath` pour invalider le cache des pages concernées (ex: `/profile`).
7.  La modale reçoit la réponse de l'action (succès/erreur) et affiche un toast.
8.  L'utilisateur voit son score mis à jour (grâce à la mise à jour du `AuthContext` et/ou à la revalidation de la page).

---

## 7. Démonstration (Flux Utilisateur & Admin)

*   **Flux Utilisateur :**
    1.  Arrivée sur la page d'accueil.
    2.  Sélection d'un sport (ex: Football).
    3.  Affichage de la liste des équipes de Football et des événements managés pour ce sport.
    4.  Navigation vers la page de profil d'une équipe (ex: Real Madrid).
        *   Consultation du résumé IA, du coach, de l'effectif, de l'historique des matchs (API).
        *   Consultation des événements managés spécifiques à cette équipe.
        *   Interaction avec l'assistant IA (poser une question).
    5.  Inscription / Connexion. L'utilisateur reçoit 10 points.
    6.  Pari sur un événement managé "upcoming", "live" ou "paused" depuis la page des équipes ou le profil d'une équipe.
    7.  Consultation de la page de profil utilisateur (score, historique des paris, classement).
    8.  Si le score est à zéro, possibilité d'obtenir 100 points gratuits.
    9.  Changement de thème et de mode d'affichage.

*   **Flux Administrateur :**
    1.  Navigation vers la page `/admin`.
    2.  Création d'un nouvel événement managé (ex: "Finale Amicale" entre deux équipes de football), avec un statut initial "upcoming".
    3.  Mise à jour d'un événement existant :
        *   Passage du statut à "live". Saisie des scores en direct, du temps écoulé.
        *   Passage du statut à "paused".
        *   Passage du statut à "finished". Le gagnant est déterminé automatiquement si les scores diffèrent. L'admin peut confirmer/modifier. Les paris associés sont réglés.
        *   Passage du statut à "cancelled".
    4.  Vérification de l'impact sur la page utilisateur (affichage de l'événement, mise à jour des scores des parieurs).

---

## 8. Questions Fréquentes (FAQ)

*   **Q1 : Pourquoi avoir choisi Next.js comme framework ?**
    *   R : Next.js offre un excellent équilibre entre rendu côté serveur (pour les performances et le SEO) et rendu côté client (pour l'interactivité). Son App Router, les Server Components, et les Server Actions simplifient le développement full-stack avec React.

*   **Q2 : Pourquoi SQLite pour la base de données ?**
    *   R : SQLite est une base de données légère, basée sur des fichiers, facile à configurer et à déployer pour des projets de petite à moyenne taille ou pour le prototypage. Elle ne nécessite pas de serveur de base de données séparé. Pour une application à plus grande échelle, une base de données comme PostgreSQL ou MySQL serait plus appropriée.

*   **Q3 : Quelles sont les limitations de l'API de données sportives (API-Sports) ?**
    *   R : Le plan gratuit d'API-Sports (utilisé ici) impose des quotas sur le nombre de requêtes par jour (ex: 100/jour/API). Il limite également l'accès aux données historiques (souvent seulement la saison en cours ou la précédente). Pour une application en production, un plan payant serait nécessaire.

*   **Q4 : Comment l'IA (Genkit/Gemini) génère-t-elle les informations ?**
    *   R : Nous fournissons à Genkit un "prompt" (une instruction textuelle) qui décrit le type d'information que nous souhaitons. Par exemple, "Donne-moi un résumé de l'équipe X" ou "Réponds à cette question sur le joueur Y". Genkit utilise le modèle Gemini de Google pour comprendre ce prompt et générer une réponse textuelle. Le prompt est conçu pour être adaptable.

*   **Q5 : Comment ajouter le support pour un nouveau sport ?**
    *   R : Il faut :
        1.  Ajouter la définition du sport dans `src/lib/mockData.ts` (`supportedSports`).
        2.  Si le sport utilise API-Sports, ajouter les fonctions nécessaires dans `src/services/apiSportsService.ts` pour appeler les bons endpoints et mapper les données.
        3.  Créer les pages Next.js correspondantes dans `src/app/sports/[nouveauSportSlug]/...`.
        4.  Créer les composants React nécessaires pour afficher les données spécifiques à ce sport.
        5.  Si des données statiques sont nécessaires (ex: liste d'équipes de base), les ajouter à `mockData.ts`.
        6.  Adapter potentiellement les prompts Genkit si des informations IA spécifiques sont souhaitées.

*   **Q6 : Que faire si mon score de pari tombe à zéro ?**
    *   R : Vous avez de la chance ! Sur votre page de profil, si votre score est de 0 ou moins, un bouton apparaîtra pour vous permettre d'obtenir 100 points gratuits afin que vous puissiez continuer à parier.

*   **Q7 : L'application gère-t-elle l'argent réel pour les paris ?**
    *   R : Non, absolument pas. Le système de paris est purement ludique et utilise des points virtuels sans valeur monétaire.

---

## 9. Extensions Futures Possibles

*   Support de plus de sports (Tennis, Rugby, eSport...).
*   Statistiques plus détaillées pour les équipes et joueurs via l'API.
*   Notifications en temps réel pour les matchs suivis ou les événements de paris.
*   Fonctionnalités sociales (commentaires sur les matchs, partage de paris).
*   Intégration de plus de données live (résultats en direct pour les matchs API si les quotas le permettent).
*   Système de "ligues de paris" entre amis.
*   Archivage des événements managés terminés pour alléger l'affichage par défaut (option admin).
*   Possibilité pour l'admin de modifier/annuler un pari en cas d'erreur.
*   Amélioration de l'interface de l'assistant IA (streaming des réponses, historique des conversations).

---

## 10. Conclusion

*   SportSphere offre une plateforme centralisée et interactive pour les informations sportives et les paris amicaux.
*   L'utilisation de Next.js, Genkit, et ShadCN UI permet une expérience utilisateur moderne et performante.
*   L'architecture modulaire facilite l'ajout de nouveaux sports et fonctionnalités.

**Merci ! Des questions ?**
