# ALINO-Billard

Boutique e-commerce premium spécialisée dans le pool américain (8-ball,
9-ball, 10-ball) au Cameroun : catalogue dynamique, panier, commandes,
paiement Mobile Money (NotchPay), livraison, services d'entretien, et
administration complète.

## Stack technique

- **Framework** : Next.js 16 (App Router, TypeScript)
- **UI** : React 19 + Tailwind CSS v4
- **Base de données** : PostgreSQL (Neon) + Prisma 7
- **Authentification** : Auth.js v5 (Credentials + JWT), rôles CUSTOMER / DELIVERY / ADMIN / SUPER_ADMIN
- **Médiathèque** : Cloudinary (upload signé, optimisation automatique)
- **Paiement** : NotchPay (MTN Mobile Money, Orange Money) via une interface `PaymentProvider` remplaçable
- **Tests** : Vitest (unitaires + intégration)

## Démarrage local

```bash
npm install
cp .env.example .env   # puis renseigner les valeurs (voir docs/DEPLOYMENT.md)
npm run db:migrate     # applique le schéma Prisma
npm run db:seed        # catégories, produits/services de démo, comptes de démo
npm run dev
```

Le seed crée deux comptes de démonstration : un super administrateur
(`admin@alino-billard.com`) et un livreur (`livreur@alino-billard.com`). Leurs
mots de passe ne sont **jamais écrits dans le dépôt** : définir
`SEED_ADMIN_PASSWORD` et `SEED_DELIVERY_PASSWORD` avant `npm run db:seed`, sinon
des mots de passe aléatoires sont générés et affichés une seule fois à la fin du
seed. Ne jamais lancer le seed sur la base de production sans définir ces
variables, et changer ensuite les mots de passe depuis
*Administration → Utilisateurs*.

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Tests unitaires (rapides, sans base de données) |
| `npm run test:integration` | Tests d'intégration (tapent une vraie base — voir `DATABASE_URL`) |
| `npm run db:migrate` | Applique les migrations Prisma (dev) |
| `npm run db:deploy` | Applique les migrations Prisma (prod, non-interactif) |
| `npm run db:seed` | Peuple la base avec les données de démonstration |
| `npm run db:studio` | Interface graphique Prisma pour explorer la base |

## Structure du projet

```
prisma/               schéma de données, migrations, seed
src/
  app/
    (shop)/            boutique publique (accueil, catalogue, panier, commande...)
    admin/              interface d'administration (protégée par rôle)
    api/                routes API (auth, webhooks)
  components/           composants React (shop/ admin/)
  lib/                  logique partagée (auth, panier, paiements, validation Zod...)
  server/actions/        Server Actions (une "API" par domaine métier)
docs/
  DEPLOYMENT.md         guide de déploiement complet
```

## Documentation

Voir [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) pour la procédure complète de
déploiement (base de données, variables d'environnement, paiements,
webhooks, domaine, HTTPS, sauvegardes et restauration).
