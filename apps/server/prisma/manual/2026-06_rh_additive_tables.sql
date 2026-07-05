-- ============================================================================
-- Migration additive RH — tables & colonnes ajoutées hors `prisma migrate`
-- (la base Neon partagée est "driftée" : `prisma migrate dev` voudrait la
--  réinitialiser, donc on applique ces changements en SQL pur, purement additif).
--
-- À exécuter sur toute base Postgres cible (prod incluse) qui n'a pas déjà
-- ces objets. Idempotent (IF NOT EXISTS). N'affecte aucune table existante.
--
-- Usage :  cd apps/server && bunx prisma db execute --file prisma/manual/2026-06_rh_additive_tables.sql
-- ============================================================================

-- Clients ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "client" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "city" TEXT,
  "postalCode" TEXT,
  "country" TEXT,
  "contactPerson" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "siret" TEXT,
  "numTVA" TEXT,
  "sector" TEXT,
  "dirigeant" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "client_organizationId_idx" ON "client"("organizationId");

-- Sous-traitants --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "subcontractor" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "siret" TEXT,
  "address" TEXT,
  "email" TEXT,
  "telephone" TEXT,
  "capitalSocial" TEXT,
  "numeroAutorisation" TEXT,
  "dateDebut" TEXT,
  "statut" TEXT NOT NULL DEFAULT 'actif',
  "prochainRenouvellement" TEXT,
  "dirigeant" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subcontractor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "subcontractor_organizationId_idx" ON "subcontractor"("organizationId");

-- Notes de frais --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "expense_report" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "items" JSONB NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "paymentDate" TIMESTAMP(3),
  "exportedToPayroll" BOOLEAN NOT NULL DEFAULT false,
  "exportedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expense_report_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "expense_report_organizationId_idx" ON "expense_report"("organizationId");

-- Variables de paie -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "payroll_variable" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "employeeName" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payroll_variable_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "payroll_variable_organizationId_idx" ON "payroll_variable"("organizationId");

-- Indemnité d'habillage (fiche employé) ---------------------------------------
ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "dressingAllowance" BOOLEAN NOT NULL DEFAULT false;
