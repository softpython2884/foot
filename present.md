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
        *   Affichage des événements managés sur les pages des sports et des équipes.

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

## 4. Architecture & Concepts Clés

*   **Server Components & Server Actions (Next.js) :** Pour une logique backend optimisée et des mutations de données sécurisées directement depuis les composants.
*   **Context API (React) :** Pour la gestion de l'état global (utilisateur authentifié, thème visuel).
*   **Service API Centralisé :** `apiSportsService.ts` pour une gestion unifiée des appels aux API externes de données sportives.
*   **Base de Données Locale :** Schéma SQLite pour stocker les utilisateurs, les événements managés personnalisés, et les paris.
*   **Routage Dynamique :** Structure de dossiers intuitive dans `src/app/sports/[sportSlug]/...` pour gérer les différentes pages par sport et par équipe/entité.
*   **Sécurité & Validation :** Utilisation de Zod pour la validation des données des formulaires et des actions serveur.

---

## 5. Démonstration (Flux Utilisateur & Admin)

*   **Flux Utilisateur :**
    1.  Arrivée sur la page d'accueil.
    2.  Sélection d'un sport (ex: Football).
    3.  Affichage de la liste des équipes de Football.
    4.  Navigation vers la page de profil d'une équipe (ex: Real Madrid).
        *   Consultation du résumé IA, du coach, de l'effectif, de l'historique des matchs.
        *   Interaction avec l'assistant IA (poser une question).
    5.  Retour à la liste des équipes de Football, consultation des événements managés.
    6.  Inscription / Connexion.
    7.  Pari sur un événement managé "upcoming" ou "live".
    8.  Consultation de la page de profil utilisateur (score, historique des paris, classement).
    9.  Changement de thème et de mode d'affichage.
    10. "Achat" de points si le solde est nul.

*   **Flux Administrateur :**
    1.  Navigation vers la page `/admin`.
    2.  Création d'un nouvel événement managé (ex: "Finale Amicale" entre deux équipes de football).
    3.  Mise à jour d'un événement existant :
        *   Passage du statut à "live".
        *   Saisie des scores en direct, du temps écoulé.
        *   Passage du statut à "finished", détermination automatique du gagnant, et règlement des paris associés.
    4.  Vérification de l'impact sur la page utilisateur (affichage de l'événement, mise à jour des scores des parieurs).

---

## 6. Extensions Futures Possibles

*   Support de plus de sports (Tennis, Rugby, eSport...).
*   Statistiques plus détaillées pour les équipes et joueurs via l'API.
*   Notifications en temps réel pour les matchs suivis ou les événements de paris.
*   Fonctionnalités sociales (commentaires sur les matchs, partage de paris).
*   Intégration de plus de données live (résultats en direct pour les matchs API si les quotas le permettent).
*   Système de "ligues de paris" entre amis.
*   Archivage des événements managés terminés pour alléger l'affichage par défaut.
*   Possibilité pour l'admin de modifier/annuler un pari en cas d'erreur.
*   Amélioration de l'interface de l'assistant IA (streaming des réponses, historique des conversations).

---

## 7. Conclusion

*   SportSphere offre une plateforme centralisée et interactive pour les informations sportives et les paris amicaux.
*   L'utilisation de Next.js, Genkit, et ShadCN UI permet une expérience utilisateur moderne et performante.
*   L'architecture modulaire facilite l'ajout de nouveaux sports et fonctionnalités.

**Merci ! Des questions ?**
