# Déploiement de ALINO-Billard

Guide complet pour passer du développement local à une mise en production
réelle. Stack recommandée : **Vercel** (application) + **Neon**
(PostgreSQL) + **Cloudinary** (médiathèque) + **NotchPay** (paiement Mobile
Money) — c'est la stack déjà utilisée et vérifiée pendant le développement.

---

## 1. Création de la base de données

1. Créer un compte sur [neon.tech](https://neon.tech) (gratuit pour démarrer).
2. Créer un nouveau projet. Choisir une région proche du Cameroun (Europe
   recommandée) pour limiter la latence.
3. Dans le dashboard du projet, aller dans **Connection Details** et copier
   la chaîne de connexion **directe** (pas la version "pooled"/PgBouncer —
   nécessaire pour les migrations).
4. Conserver aussi la version **pooled** : c'est celle à utiliser comme
   `DATABASE_URL` en production (l'application tourne en environnement
   serverless sur Vercel, qui ouvre beaucoup de connexions courtes — le
   pooler évite d'épuiser les connexions PostgreSQL disponibles).

## 2. Configuration des variables d'environnement

Toutes les variables sont documentées dans [`.env.example`](../.env.example).
Sur Vercel : **Project Settings > Environment Variables**, à renseigner pour
l'environnement **Production** (et **Preview** si des previews sont utilisées) :

| Variable | Où l'obtenir |
|---|---|
| `DATABASE_URL` | Neon — connexion **pooled** |
| `AUTH_SECRET` | Générer avec `openssl rand -base64 32` (une valeur différente de celle du développement local) |
| `NEXTAUTH_URL` | URL de production, ex. `https://alino-billard.com` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Dashboard Cloudinary > Settings > API Keys |
| `NOTCHPAY_PUBLIC_KEY` / `NOTCHPAY_SECRET_KEY` | Dashboard NotchPay — **basculer de Sandbox à Live** avant la mise en production réelle |
| `NOTCHPAY_WEBHOOK_HASH` | Voir section 6 ci-dessous |
| `NEXT_PUBLIC_SITE_URL` | URL de production (utilisée pour le sitemap, robots.txt, et les callbacks de paiement) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro WhatsApp de la boutique (optionnel, peut aussi être géré depuis l'admin > Paramètres) |

**Ne jamais committer `.env`** — il est déjà exclu par `.gitignore`.

## 3. Migrations

En local ou en CI, avant le premier déploiement :

```bash
DATABASE_URL="<connexion directe Neon>" npm run db:deploy
```

`db:deploy` (`prisma migrate deploy`) applique les migrations existantes sans
essayer d'en générer de nouvelles — c'est la commande à utiliser en
production (jamais `migrate dev`, qui est interactif et peut réinitialiser
des données).

**Créer une nouvelle migration dans un terminal non-interactif** (CI, agent,
script) : `prisma migrate dev` refuse de s'exécuter dès qu'il y a le moindre
avertissement à confirmer (ex: ajout d'une contrainte unique), même avec
`--create-only`. Contournement vérifié : écrire le SQL de migration à la main
dans `prisma/migrations/<timestamp>_<nom>/migration.sql` (même format que les
migrations existantes), puis l'appliquer avec `prisma migrate deploy` (celle-ci
ne demande jamais de confirmation). Toujours vérifier ensuite avec
`prisma migrate status` qu'aucune dérive n'est détectée.

**Verrou bloqué (`P1002` / `pg_advisory_lock` timeout)** : `prisma migrate`
a besoin de la connexion **directe** (pas "pooled"/PgBouncer) pour poser son
verrou consultatif — la connexion poolée ne le supporte pas correctement et
provoque un blocage qui ressemble à un verrou "coincé" alors qu'il n'y en a
réellement aucun. Vérifié en pratique : basculer temporairement `DATABASE_URL`
vers la connexion directe le temps de la migration résout le problème
immédiatement.

## 4. Création du premier administrateur

Le seed (`npm run db:seed`) crée un compte `SUPER_ADMIN`
(`admin@alino-billard.com`) et un compte livreur de démonstration. **Aucun mot de
passe n'est écrit dans le dépôt** : en production, définir `SEED_ADMIN_PASSWORD`
(et `SEED_DELIVERY_PASSWORD`) avant de lancer le seed, avec des valeurs longues
et uniques, ou noter les mots de passe générés affichés à la fin du seed.

1. Exécuter le seed avec ces variables (ou créer le compte manuellement via
   Prisma Studio / une requête SQL avec un mot de passe haché en bcrypt).
2. Se connecter sur `/compte/connexion` avec ce compte.
3. Définir votre propre mot de passe : *Administration → Utilisateurs →
   réinitialiser le mot de passe* (le compte choisit ensuite un nouveau mot de
   passe, connu de lui seul, à sa prochaine connexion).
4. Créer les comptes ADMIN/DELIVERY réels depuis l'admin, puis supprimer ou
   désactiver le compte livreur de démonstration.

## 5. Configuration des paiements (NotchPay)

1. Créer un compte sur [notchpay.co](https://notchpay.co) si ce n'est pas
   déjà fait.
2. En mode **Sandbox**, les clés commencent par `pk_test.` / `sk_test.` —
   c'est ce qui a été utilisé pendant le développement.
3. Pour la production : compléter la vérification du compte marchand
   (KYC) dans le dashboard NotchPay, puis basculer sur l'environnement
   **Live** pour obtenir les clés `pk_live.` / `sk_live.`.
4. Renseigner `NOTCHPAY_PUBLIC_KEY` et `NOTCHPAY_SECRET_KEY` en production
   avec ces clés live.

### Alternative : Monetbil

Le site sait aussi encaisser par Monetbil (MTN Mobile Money + Orange Money), avec
`PAYMENT_PROVIDER=monetbil`.

1. Créer un compte sur [monetbil.com](https://www.monetbil.com), puis un
   « service » (votre site) : vous obtenez une **clé de service** et un **secret
   de service**, à renseigner dans `MONETBIL_SERVICE_KEY` et `MONETBIL_SERVICE_SECRET`.
2. Appliquer la migration qui ajoute la valeur `MONETBIL` (`npx prisma migrate
   deploy`). C'est un ajout seul, sans modification de données.
3. L'adresse de notification est envoyée à chaque paiement :
   `https://<votre-domaine>/api/webhooks/monetbil`. Le client, lui, revient sur
   `/commande/confirmation/<numéro>` avec les paramètres de Monetbil.
4. **Essais sans argent réel** : si votre service Monetbil est en mode test, ses
   paiements portent un statut « test ». Par sécurité, ils ne marquent JAMAIS une
   commande comme payée, sauf si `MONETBIL_TEST_MODE=true` (à ne mettre QUE sur un
   environnement d'essai, jamais en production).

Sécurité : la signature des notifications Monetbil est un simple MD5 (leur choix).
Le site la vérifie, mais ne s'y fie jamais seule : il relit systématiquement le
statut directement chez Monetbil (checkPayment) et compare le montant payé à celui
de la commande.

## 6. Configuration des webhooks

Le webhook NotchPay est la source de vérité pour la confirmation des
paiements (jamais le simple retour du client sur le site) :

1. Une fois l'application déployée et son URL publique connue
   (`https://alino-billard.com`), aller dans le dashboard NotchPay >
   **Settings > Webhooks > Add Endpoint**.
2. URL à renseigner : `https://alino-billard.com/api/webhooks/notchpay`
3. Sélectionner les événements : `payment.complete`, `payment.failed`,
   `payment.canceled`, `payment.expired`.
4. NotchPay génère un **hash de signature** (`hsk_live_...` en production,
   `hsk_test_...` en sandbox) — le copier dans la variable d'environnement
   `NOTCHPAY_WEBHOOK_HASH`.
5. Pour tester les webhooks en local avant déploiement : utiliser un tunnel
   (ex. [ngrok](https://ngrok.com)) pour exposer temporairement
   `localhost:3000` et configurer un endpoint sandbox pointant dessus.

## 7. Déploiement

1. Pousser le code sur un dépôt GitHub.
2. Créer un projet sur [vercel.com](https://vercel.com), importer le dépôt.
3. Vercel détecte automatiquement Next.js — aucune configuration de build
   particulière n'est nécessaire.
4. Renseigner toutes les variables d'environnement de la section 2 avant le
   premier déploiement.
5. Déployer. Vérifier que le build passe (les migrations doivent avoir été
   appliquées séparément au préalable, section 3 — le build ne les
   exécute pas automatiquement).

## 8. Domaine

1. Dans Vercel : **Project Settings > Domains**, ajouter le domaine
   (ex. `alino-billard.com`).
2. Chez le registrar du domaine, ajouter les enregistrements DNS indiqués
   par Vercel (généralement un `A` vers Vercel ou un `CNAME`).
3. Mettre à jour `NEXTAUTH_URL` et `NEXT_PUBLIC_SITE_URL` avec le domaine
   final, puis redéployer.

## 9. HTTPS

Automatique sur Vercel : un certificat SSL (Let's Encrypt) est généré et
renouvelé sans configuration dès qu'un domaine personnalisé est attaché et
que les DNS pointent correctement.

## 10. Sauvegardes

- **Neon** effectue des sauvegardes automatiques (point-in-time recovery)
  selon le plan souscrit — vérifier la rétention disponible dans le
  dashboard Neon (Settings > Backup/Restore).
- Pour une sauvegarde manuelle supplémentaire :
  ```bash
  pg_dump "<DATABASE_URL directe>" -F c -f backup-$(date +%Y%m%d).dump
  ```
- Les médias (images/vidéos) sont hébergés sur Cloudinary, qui conserve les
  fichiers indépendamment de la base — aucune sauvegarde applicative
  supplémentaire n'est nécessaire pour eux, mais Cloudinary propose aussi
  un export/backup dans les plans payants si une copie externe est voulue.

## 11. Restauration

- **Depuis Neon (point-in-time)** : dashboard Neon > **Restore**, choisir un
  instant précis dans la fenêtre de rétention.
- **Depuis un dump manuel** :
  ```bash
  pg_restore -d "<DATABASE_URL directe>" --clean --if-exists backup-XXXX.dump
  ```
- Après toute restauration, vérifier que `npx prisma migrate status`
  n'indique pas de migration manquante par rapport au schéma actuel du
  code déployé.

---

## Vérification post-déploiement

- [ ] `https://<domaine>/` charge correctement
- [ ] Connexion admin fonctionne, mot de passe de démo changé
- [ ] `npx prisma migrate status` : aucune migration en attente
- [ ] Un paiement de test NotchPay (sandbox, avant de basculer en live)
      complète correctement et le webhook confirme la commande
- [ ] `https://<domaine>/sitemap.xml` et `/robots.txt` répondent
- [ ] Upload d'image produit fonctionne (Cloudinary)
