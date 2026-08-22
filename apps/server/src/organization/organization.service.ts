import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  SAFYR_BUCKET,
  STORAGE_PREFIX_DOCUMENTS,
  StorageService,
} from "@/storage/storage.service";
import type {
  UpdateOrganizationDto,
  CreateRepresentativeDto,
} from "@safyr/schemas/organization";
import {
  statutEcheance,
  regleDe,
  echeanceDepuisDepot,
} from "@/common/document-rules";

function toDate(v: string | null | undefined): Date | null {
  return v ? new Date(v) : null;
}

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getOrganization(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        representative: true,
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID ${orgId} not found`);
    }

    return org;
  }

  async updateOrganization(orgId: string, data: UpdateOrganizationDto) {
    const { representative, ...orgData } = data;

    return await this.prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization
        .update({
          where: { id: orgId },
          data: orgData,
          include: { representative: true },
        })
        .catch((err) => {
          if (err?.code === "P2025") {
            throw new NotFoundException(
              `Organization with ID ${orgId} not found`,
            );
          }
          throw err;
        });

      if (representative && updatedOrg.representativeId) {
        const { birthDate, appointmentDate, ...rest } = representative;
        const updatedRep = await tx.representative.update({
          where: { id: updatedOrg.representativeId },
          data: {
            ...rest,
            ...(birthDate !== undefined && { birthDate: toDate(birthDate) }),
            ...(appointmentDate !== undefined && {
              appointmentDate: toDate(appointmentDate),
            }),
          },
        });
        return { ...updatedOrg, representative: updatedRep };
      }

      return updatedOrg;
    });
  }

  async createRepresentative(orgId: string, data: CreateRepresentativeDto) {
    return await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUnique({
        where: { id: orgId },
      });

      if (!org) {
        throw new NotFoundException(`Organization with ID ${orgId} not found`);
      }

      if (org.representativeId) {
        throw new BadRequestException(
          "Organization already has a representative linked",
        );
      }

      const { birthDate, appointmentDate, ...rest } = data;
      const representative = await tx.representative.create({
        data: {
          ...rest,
          ...(birthDate && { birthDate: toDate(birthDate) }),
          ...(appointmentDate && {
            appointmentDate: toDate(appointmentDate),
          }),
        },
      });

      return await tx.organization.update({
        where: { id: orgId },
        data: {
          representativeId: representative.id,
        },
        include: { representative: true },
      });
    });
  }

  async getComplianceReport(orgId: string) {
    const [requirements, documents] = await Promise.all([
      this.prisma.documentRequirement.findMany({
        where: { targetType: "ORGANIZATION" },
      }),
      this.prisma.document.findMany({ where: { organizationId: orgId } }),
    ]);

    const docByRequirement = new Map(
      documents.map((doc) => [doc.requirementId, doc]),
    );

    return requirements.map((req) => {
      const linkedDoc = docByRequirement.get(req.id) ?? null;
      const regle = regleDe(req.type);
      const status = linkedDoc
        ? statutEcheance(req.type, linkedDoc.expiryDate)
        : req.isRequired
          ? "missing"
          : "optional";
      return {
        // `hasExpiry` reflète la règle réelle : une pièce sans échéance ne
        // doit ni réclamer de date, ni déclencher d'alerte.
        requirement: { ...req, hasExpiry: regle !== null },
        document: linkedDoc,
        status,
        rule: regle
          ? {
              validityMonths: regle.validiteMois,
              alertDaysBefore: regle.preavisJours,
            }
          : null,
        expiryDate: regle ? (linkedDoc?.expiryDate ?? null) : null,
      };
    });
  }

  async createOrReplaceDocument(
    orgId: string,
    uploaderId: string,
    file: { buffer: Buffer; filename: string; mimetype: string },
    requirementId: string,
    expiryDate?: string,
  ) {
    const [requirement, existing] = await Promise.all([
      this.prisma.documentRequirement.findUnique({
        where: { id: requirementId },
      }),
      this.prisma.document.findUnique({
        where: {
          organizationId_requirementId: {
            organizationId: orgId,
            requirementId,
          },
        },
      }),
    ]);
    if (!requirement) {
      throw new NotFoundException(`Requirement ${requirementId} not found`);
    }
    if (requirement.targetType !== "ORGANIZATION") {
      throw new BadRequestException(
        `Requirement ${requirementId} is not an organization requirement`,
      );
    }

    const key = this.storage.buildStorageKey(
      STORAGE_PREFIX_DOCUMENTS,
      file.filename,
    );

    await this.storage.uploadObject(SAFYR_BUCKET, key, file.buffer, {
      contentType: file.mimetype,
      metadata: {
        uploaderId,
        entityType: "document",
        originalName: file.filename,
        mimeType: file.mimetype,
      },
    });

    // L'échéance n'a de sens que pour les pièces soumises à renouvellement ;
    // à défaut de date saisie, on la déduit de la règle du document.
    const regle = regleDe(requirement.type);
    const expiry = regle
      ? expiryDate
        ? new Date(expiryDate)
        : echeanceDepuisDepot(requirement.type, new Date())
      : null;
    const status = statutEcheance(requirement.type, expiry);

    const document = await this.prisma.document.upsert({
      where: {
        organizationId_requirementId: { organizationId: orgId, requirementId },
      },
      create: {
        name: file.filename,
        storageKey: key,
        mimeType: file.mimetype,
        size: file.buffer.length,
        status,
        expiryDate: expiry,
        requirementId,
        organizationId: orgId,
        uploaderId,
      },
      update: {
        name: file.filename,
        storageKey: key,
        mimeType: file.mimetype,
        size: file.buffer.length,
        status,
        expiryDate: expiry,
        uploaderId,
      },
    });

    if (existing && existing.storageKey !== key) {
      await this.storage.deleteObjectSafe(SAFYR_BUCKET, existing.storageKey);
    }

    return document;
  }

  /**
   * Supprime le document rattaché à une exigence documentaire de
   * l'entreprise (fichier de stockage + ligne en base).
   */
  async deleteDocumentByRequirement(orgId: string, requirementId: string) {
    const existing = await this.prisma.document.findUnique({
      where: {
        organizationId_requirementId: {
          organizationId: orgId,
          requirementId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Aucun document à supprimer");
    }

    await this.prisma.document.delete({ where: { id: existing.id } });
    await this.storage.deleteObjectSafe(SAFYR_BUCKET, existing.storageKey);

    return { id: existing.id, requirementId };
  }
}
