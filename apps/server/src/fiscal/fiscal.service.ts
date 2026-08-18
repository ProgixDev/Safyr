import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreateFiscalRecordDto,
  UpdateFiscalRecordDto,
  FiscalRecordType,
} from "@safyr/schemas/fiscal";
import type { Prisma } from "generated/prisma/client";

/**
 * Registres administratifs : déclarations de TVA, CFE, prélèvement à la
 * source, courriers fiscaux et dossiers AKTO/OPCO.
 *
 * Ces écrans ne conservaient leurs lignes qu'en mémoire : les documents
 * téléversés disparaissaient à la reconnexion.
 */
@Injectable()
export class FiscalService {
  constructor(private readonly prisma: PrismaService) {}

  list(orgId: string, type?: FiscalRecordType, period?: string) {
    return this.prisma.fiscalRecord.findMany({
      where: {
        organizationId: orgId,
        ...(type ? { type } : {}),
        ...(period ? { period: { startsWith: period } } : {}),
      },
      orderBy: [{ period: "desc" }, { createdAt: "asc" }],
    });
  }

  async get(orgId: string, id: string) {
    const record = await this.prisma.fiscalRecord.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!record) throw new NotFoundException("Ligne introuvable");
    return record;
  }

  create(orgId: string, dto: CreateFiscalRecordDto) {
    return this.prisma.fiscalRecord.create({
      data: {
        organizationId: orgId,
        type: dto.type,
        period: dto.period,
        label: dto.label,
        status: dto.status ?? "en_attente",
        amount: dto.amount ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        meta: (dto.meta ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async update(orgId: string, id: string, dto: UpdateFiscalRecordDto) {
    await this.get(orgId, id);
    return this.prisma.fiscalRecord.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.period !== undefined ? { period: dto.period } : {}),
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
        ...(dto.meta !== undefined
          ? { meta: dto.meta as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async remove(orgId: string, id: string) {
    await this.get(orgId, id);
    // Les pièces jointes de la ligne suivent la suppression.
    await this.prisma.document.deleteMany({
      where: { organizationId: orgId, scopeId: id },
    });
    return this.prisma.fiscalRecord.delete({ where: { id } });
  }
}
