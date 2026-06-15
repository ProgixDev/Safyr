# Rapport d'avancement — Module RH (Safyr)

**Date :** 15 juin 2026
**Périmètre :** Corrections et évolutions du module RH suite aux remarques client du 11 juin 2026
**Application :** `apps/web` (Next.js) + `apps/server` (NestJS) — interface 100 % française

---

## 1. Résumé exécutif

L'ensemble des remarques du client a été repris **module par module**. La **structure complète du module RH est en place et fonctionnelle** sur l'environnement de test. Ce qui reste à faire concerne principalement des **intégrations côté serveur** (signature électronique, stockage des fichiers, automatisations) qui se branchent progressivement sur cette base.

Un correctif de base de données a également été appliqué (table `Site` manquante) pour débloquer la création de sites.

---

## 2. Livré et fonctionnel ✅

| Module | Fonctionnalité livrée |
|---|---|
| **Tableau de bord RH** | KPI transformés en graphiques (courbes, nuages de points, histogrammes) |
| **Mon entreprise** | Logo, bouton Modifier/Enregistrer global, **auto-remplissage par SIRET** (répertoire officiel INSEE/data.gouv), onglet Alertes, Divers documents |
| **Collaborateurs** | Fiche éditable, **détection automatique BIC + banque depuis l'IBAN**, **Qualifications multi-sélection** (SSIAP1/2/3, SST, H0B0, Carte Pro, CQP/APS, Autres), onglet Discipline |
| **Annuaire & Dossiers salariés** | Liste, recherche, accès au dossier individuel (renommé pour correspondre au vocabulaire client) |
| **Cycle de vie** | Candidatures · **Vérifications réglementaires (lien DRACAR/CNAPS + retour Conforme/Non conforme)** · Parcours d'intégration (onboarding) · Parcours de départ (offboarding) |
| **Temps & Activités** | Relevé des heures (normales + supplémentaires 25 % / 50 %), compteur heures sup., absences ; liens de navigation réparés |
| **Rémunération & Paie** | Variables de paie (dont Indemnité d'habillage), contrôle, liens réparés |
| **Santé & Formation** | Types de formation enrichis (**MAC/CQP**, **MAC/SST**), matrices d'habilitations, registres |
| **Sites / Postes** | **Création de site corrigée** (table de base de données créée) |
| **Entreprise → Impôts (SIE)** | Téléchargement document par document dans les tableaux (TVA, CFE, PAS) |
| **Entreprise → Divers documents** | Menu d'actions 3 points (Voir / Télécharger / Supprimer), statuts (En attente / En cours / Traité), police agrandie |
| **Entreprise → Clients** | Cadres des champs rétablis (cohérence avec Entreprise/Sous-traitant), gestion des **Cadeaux** (clic sur ligne → dossier, menu 3 points, reçu/facture) |

---

## 3. En place mais en attente du backend 🟡

Les **téléchargements de documents** (Divers documents, Impôts, Cadeaux, Onboarding, Dossiers salariés) **fonctionnent au niveau de l'interface** mais génèrent actuellement un **fichier témoin**. Les fichiers réels seront servis une fois le **stockage backend (Supabase)** connecté.

---

## 4. Reste à faire — intégrations serveur ⚙️

| Demande client | Nature | Statut |
|---|---|---|
| Signature électronique des contrats (module Salariés) | Intégration prestataire à valeur légale (Yousign/DocuSign) | À brancher |
| Import automatique des candidats (email entreprise / site web) | Ingestion email + formulaire de candidature | À brancher |
| Vérification DRACAR 100 % automatique | Nécessite un accès API DRACAR/CNAPS (pas d'API publique) | À évaluer |
| Indemnité d'habillage : case sur la fiche + calcul automatique selon les heures | Champ base de données + logique de paie | À brancher |
| Persistance des qualifications en base | Champ base de données | À brancher |
| Fichiers réels des dossiers (Onboarding, Documents) | Stockage Supabase | À brancher |
| Refonte design du Bilan social | Amélioration UI (non bloquant) | À planifier |

---

## 5. Points techniques notables

- **Correctif base de données :** la table `Site` (et `Post`) était absente de la base → erreur 500 à la création d'un site. Tables créées via synchronisation Prisma (opération **additive, sans perte de données**). Création/lecture/suppression de site vérifiées et fonctionnelles.
- **Auto-remplissage SIRET :** branché sur le **répertoire officiel des entreprises** (INSEE/data.gouv, gratuit, sans clé). L'architecture permet de passer à **Pappers** ultérieurement en modifiant un seul point du code, sans impact sur le reste.
- **Détection bancaire :** mapping des codes banques français (≈ 20 banques : BNP, Société Générale, Crédit Agricole, LCL, La Banque Postale, Caisse d'Épargne, Boursorama…).

---

## 6. Recommandation

La base RH est solide et démontrable. Je propose de **prioriser les intégrations serveur** dans l'ordre suivant pour l'impact métier :
1. Stockage des fichiers réels (débloque tous les téléchargements d'un coup)
2. Persistance qualifications + indemnité d'habillage (calcul de paie)
3. Signature électronique des contrats
4. Automatisations (import candidats, DRACAR)

---

*Document généré le 15 juin 2026.*
