# Déploiement Safyr sur Vercel

Ce guide te permet de déployer **Safyr** (backend NestJS + frontend Next.js) **entièrement sur Vercel** en environ 30 minutes.

## Pré-requis (comptes à créer, tous gratuits)

| Service | Pour quoi | Lien |
|---|---|---|
| **GitHub** | Pousser le code | https://github.com |
| **Vercel** | Hébergement web + serverless functions | https://vercel.com |
| **Neon** | Postgres serverless | https://neon.tech |
| **Resend** | Envoi d'emails OTP réels | https://resend.com |
| **Supabase** *(optionnel)* | Stockage de fichiers | https://supabase.com |

Tu peux te connecter à tous ces services avec ton compte GitHub.

---

## Étape 1 — Pousser le code à jour sur GitHub

Depuis la racine du projet :

```bash
cd C:\Users\ihebn\Desktop\safyyr\Safyr
git add .
git commit -m "feat: sprint 1-7 modules + Vercel deployment config"
git push origin main
```

---

## Étape 2 — Créer la base Postgres (Neon)

1. Va sur https://console.neon.tech/signup → connexion GitHub
2. **Create project**
   - Nom : `safyr-prod`
   - Region : `eu-central-1` (Francfort)
   - Postgres version : 16
3. Une fois créé, dans **Connection string** copie la chaîne (commence par `postgresql://...`)
4. Garde-la sous le coude — c'est ton **DATABASE_URL**

---

## Étape 3 — Configurer Resend (emails OTP)

1. https://resend.com/signup → connexion GitHub
2. **API Keys → Create API Key** → nom `safyr-prod`
3. Copie la clé (commence par `re_...`)
4. Pour pouvoir envoyer des emails sans configurer un domaine custom, utilise l'adresse `onboarding@resend.dev` comme `SMTP_FROM`

Resend expose un SMTP standard :
- `SMTP_HOST` = `smtp.resend.com`
- `SMTP_PORT` = `465`
- `SMTP_USER` = `resend`
- `SMTP_PASS` = ta clé API (`re_...`)
- `SMTP_FROM` = `Safyr <onboarding@resend.dev>`

---

## Étape 4 — Déployer le **backend** sur Vercel

1. https://vercel.com/new → **Import Git Repository** → choisis `DigitariaWebs/Safyr`
2. Premier projet : **safyr-api**
   - **Project name** : `safyr-api`
   - **Root directory** : `apps/server`
   - **Framework Preset** : `Other`
   - Vercel va lire `apps/server/vercel.json` automatiquement (rewrites + functions)

3. Avant de cliquer Deploy, ajoute les **Environment Variables** (onglet Settings → Environment Variables) :

| Nom | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (chaîne Neon de l'étape 2) |
| `BETTER_AUTH_SECRET` | génère 32 chars random : `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://safyr-api.vercel.app` (le domaine sera créé après Deploy) |
| `ALLOWED_ORIGINS` | `https://safyr-web.vercel.app` (à compléter après l'étape 5) |
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | (clé Resend) |
| `SMTP_FROM` | `Safyr <onboarding@resend.dev>` |
| `LOG_LEVEL` | `info` |
| `SUPABASE_URL` | *(optionnel — laisse vide pour test)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(optionnel)* |

4. Clique **Deploy**. Premier build = 3-5 minutes.

5. Une fois déployé, note l'URL publique (genre `https://safyr-api.vercel.app`).

6. Crée les tables Postgres dans Neon — depuis ton terminal local :
   ```bash
   cd C:\Users\ihebn\Desktop\safyyr\Safyr\apps\server
   # Surcharge temporairement DATABASE_URL pour pousser le schéma sur Neon
   set DATABASE_URL="postgresql://...neon..." && bunx prisma db push --accept-data-loss
   # Puis seed pour avoir le compte demo
   set DATABASE_URL="postgresql://...neon..." && bun run db:seed
   ```

   Tu auras alors les comptes seedés :
   - `prodigesecurite@gmail.com` (Owner)
   - `khalil3cheddadi@gmail.com` (Owner)
   - `marie.dupont@prodige-securite.fr` (Agent)
   - `thomas.martin@prodige-securite.fr` (Agent)
   - `sophie.leroy@prodige-securite.fr` (Agent)

---

## Étape 5 — Déployer le **frontend** sur Vercel

1. https://vercel.com/new → re-import `DigitariaWebs/Safyr`
2. Second projet : **safyr-web**
   - **Project name** : `safyr-web`
   - **Root directory** : `apps/web`
   - **Framework Preset** : `Next.js` (auto-détecté)

3. Environment Variables :

| Nom | Valeur |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://safyr-api.vercel.app` (URL du backend de l'étape 4) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | (optionnel — crée un compte gratuit sur https://account.mapbox.com pour la carte live) |

4. **Deploy**

5. Retour sur **safyr-api** → Settings → Environment Variables → modifier `ALLOWED_ORIGINS` :
   ```
   https://safyr-web.vercel.app
   ```
   Puis **Redeploy** le backend pour appliquer le CORS.

---

## Étape 6 — Tester en production

1. Ouvre **https://safyr-web.vercel.app/login**
2. Email : `prodigesecurite@gmail.com`
3. Choisis "Code OTP" → "Recevoir un code"
4. **Le code arrive dans la vraie boîte Gmail** `prodigesecurite@gmail.com` ✅
5. Saisis le code → tu arrives sur le dashboard

Pour un utilisateur externe à inviter :
- Va sur `/dashboard/hr/collaborators` → **Nouvel employé**
- Remplis avec leur vrai email, statut Agent ou Owner
- À la création, Better-auth envoie une invitation par email
- L'utilisateur clique sur le lien, reçoit son OTP

---

## Limitations du déploiement Vercel serverless

- **Cold start** : la première requête après inactivité prend 3-8 secondes
- **Pas de WebSocket** : le rafraîchissement temps réel est en polling (toutes les 15-30 sec) — déjà géré côté front
- **Timeout 30 secondes** : pas un problème pour les requêtes API courantes
- **File upload** limité à 4.5 Mo en serverless Vercel (pour Storage Supabase, utiliser des presigned URLs directs côté client)
- **Rate limiting** désactivé en serverless (chaque cold start réinitialise) — à mettre en Vercel Edge Middleware plus tard

---

## Configuration custom — Domaine personnel

Une fois que tout marche, tu peux ajouter ton propre domaine :

1. Sur **safyr-web** → Settings → Domains → `app.safyr.com`
2. Sur **safyr-api** → Settings → Domains → `api.safyr.com`
3. Met à jour les env vars :
   - `BETTER_AUTH_URL` = `https://api.safyr.com`
   - `ALLOWED_ORIGINS` = `https://app.safyr.com`
   - `NEXT_PUBLIC_API_URL` = `https://api.safyr.com`

---

## Compte démo à partager

Une fois la plateforme déployée, tu peux partager :

- **URL** : https://safyr-web.vercel.app
- **Identifiant** : `prodigesecurite@gmail.com` (ou tout autre compte seedé)
- **Mode de connexion** : Code OTP par email (le code arrive dans la boîte mail réelle)

Si tu veux un compte "demo" avec mot de passe simple plutôt que par OTP, on peut activer le plugin `username` + password de better-auth sur demande.

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| 500 sur tout le backend | `DATABASE_URL` invalide | Vérifier la chaîne Neon, l'IP allowlist |
| 401 partout après login | `BETTER_AUTH_URL` mismatch | Doit matcher le domaine du backend |
| CORS blocked | `ALLOWED_ORIGINS` manquant | Ajouter le domaine du web |
| OTP n'arrive pas en email | SMTP Resend mal configuré | Vérifier `SMTP_PASS` = clé API valide |
| Cold start trop long | Premier hit après inactivité | Normal, requête suivante = rapide |

Pour les logs en temps réel : `vercel logs safyr-api --follow`
