# FootHub ⚽

PWA football installable construite avec **Next.js 16 (App Router)**, **MongoDB / Mongoose**, **NextAuth v4**, **zod** et **Tailwind CSS**.

> La spécification prévoyait Next.js 15. Le projet est passé à **Next.js 16** car, avec Next 15.5, des Server Actions
> restaient bloquées au hasard en production (bouton qui tourne sans fin). Avec Next 16, le test de bout en bout
> complet (79 étapes) passe entièrement.
6 modules : Utilisateurs, Forum, Football & Mon XI, Boutique, Réservation de terrains, Tournois.

## Installation

Prérequis : Node.js 20+ et MongoDB (local, ou une base gratuite MongoDB Atlas).

```bash
npm install
cp .env.example .env.local    # puis compléter les valeurs
```

`.env.local` :

```
MONGODB_URI=mongodb://127.0.0.1:27017/foothub
NEXTAUTH_SECRET=<chaîne aléatoire>      # ex. : node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_URL=http://localhost:3000
```

### Données football (une seule fois)

1. Télécharger le jeu de données **transfermarkt-datasets** :
   - Kaggle : `davidcariboo/player-scores` (compte gratuit), bouton *Download* ;
   - ou l'archive zip liée dans le README du dépôt GitHub `dcaribou/transfermarkt-datasets`.
2. Décompresser ces 5 fichiers dans `data/raw/` (dossier ignoré par Git) :
   `competitions.csv`, `clubs.csv`, `players.csv`, `games.csv`, `appearances.csv`.
3. Importer (quelques minutes, `appearances.csv` est volumineux) :

```bash
npm run import:football
```

Le script vide puis remplit `competitions`, `clubs`, `games`, `players` : il peut être relancé sans créer de doublons.
Les compétitions importées sont dans la constante `KEEP` de `scripts/import-football.ts`.

### Données d'exemple et lancement

```bash
npm run seed       # compte admin + 8 produits + 5 terrains (ne touche pas aux données football)
npm run seed:demo  # facultatif : utilisateurs, forum, produits, commandes, réservations, tournois, un XI
npm run dev        # http://localhost:3000
```

Le service worker n'est actif qu'en production :

```bash
npm run build && npm start
```

## Comptes de démonstration

| Rôle  | E-mail             | Mot de passe |
| ----- | ------------------ | ------------ |
| Admin | admin@foothub.tn   | Admin1234!   |
| Utilisateurs (après `npm run seed:demo`) | yassine@, amira@, mehdi@, salma@, karim@foothub.tn | Demo1234! |

D'autres comptes se créent via `/register`.

## Organisation du code

| Dossier             | Contenu                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `app/`              | Pages (Server Components) et `app/actions/<module>.ts` (Server Actions) |
| `lib/queries/`      | Fonctions de lecture MongoDB, une par module                            |
| `lib/validation/`   | Schémas zod, un fichier par module                                      |
| `lib/standings.ts`  | Calcul de classement (tournois + compétitions importées)                |
| `models/`           | 12 modèles Mongoose                                                     |
| `components/ui/`    | Composants partagés (Button, Input, Card, ConfirmDeleteButton…)         |
| `lib/client-actions.ts` | Registre des Server Actions appelées par les boutons (voir ci-dessous) |
| `scripts/`          | `import-football.ts`, `seed.ts`, `seed-demo.ts`                         |
| `proxy.ts`          | Protège les routes privées (anciennement `middleware.ts`)               |
| `public/sw.js`      | Service worker écrit à la main                                          |

Règles suivies par chaque Server Action : vérifier la session → valider le `FormData` avec zod → vérifier propriété ou rôle → écrire dans MongoDB → `revalidatePath()` → renvoyer `{ ok, error }` ou `redirect()`.

**Règle importante : ne jamais passer une Server Action en prop depuis une page serveur.**

- Les formulaires importent eux-mêmes leur action (ex. `ProductForm` importe `createProduct` et `updateProduct`) ; en modification, la page passe seulement `id`.
- Les boutons `ConfirmDeleteButton` et `ActionButton` reçoivent le **nom** de l'action et ses arguments : `<ConfirmDeleteButton action="deleteProduct" args={[p._id]} />`. Pour une nouvelle action, l'ajouter dans `lib/client-actions.ts`.

## Répartition de l'équipe

| Étudiant | Module                   | En plus                                                    |
| -------- | ------------------------ | ---------------------------------------------------------- |
| 1        | Utilisateurs             | Base du projet, `lib/db.ts`, `lib/auth.ts`, middleware, App Shell, `components/ui/` |
| 2        | Forum                    | Sections de la page d'accueil                              |
| 3        | Football & Mon XI        | `scripts/import-football.ts`, `lib/standings.ts`           |
| 4        | Boutique                 | `CartContext`, `useLocalStorage`                           |
| 5        | Réservation de terrains  | `scripts/seed.ts`                                          |
| 6        | Tournois                 | PWA : manifest, icônes, `sw.js`, page hors ligne           |

## Source des données

Données football : [transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) par David Cariboo, licence **CC0 1.0** (domaine public), également disponible sur [Kaggle](https://www.kaggle.com/datasets/davidcariboo/player-scores). Les photos et logos pointent vers Transfermarkt ; si une image ne charge pas, l'application affiche les initiales.
