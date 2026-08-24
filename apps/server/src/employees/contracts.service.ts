import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreateContractDto,
  UpdateContractDto,
} from "@safyr/schemas/contract";

/** Contrats de travail d'un salarié : CDI, CDD, intérim et avenants. */
@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureMember(orgId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException("Salarié introuvable");
  }

  list(orgId: string, memberId: string) {
    return this.prisma.contract.findMany({
      where: { organizationId: orgId, memberId },
      orderBy: { startDate: "desc" },
    });
  }

  async create(orgId: string, memberId: string, dto: CreateContractDto) {
    await this.ensureMember(orgId, memberId);
    return this.prisma.contract.create({
      data: {
        organizationId: orgId,
        memberId,
        type: dto.type,
        position: dto.position,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        workingHours: dto.workingHours ?? null,
        grossSalary: dto.grossSalary ?? null,
        trialPeriodEndDate: dto.trialPeriodEndDate
          ? new Date(dto.trialPeriodEndDate)
          : null,
        status: dto.status ?? "active",
        signedByEmployee: dto.signedByEmployee ?? false,
        signedByEmployer: dto.signedByEmployer ?? false,
        notes: dto.notes ?? null,
      },
    });
  }

  private async ensureContract(
    orgId: string,
    memberId: string,
    contractId: string,
  ) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, memberId, organizationId: orgId },
      select: { id: true },
    });
    if (!contract) throw new NotFoundException("Contrat introuvable");
  }

  async update(
    orgId: string,
    memberId: string,
    contractId: string,
    dto: UpdateContractDto,
  ) {
    await this.ensureContract(orgId, memberId, contractId);

    const data: Record<string, unknown> = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    if (dto.workingHours !== undefined) data.workingHours = dto.workingHours;
    if (dto.grossSalary !== undefined) data.grossSalary = dto.grossSalary;
    if (dto.trialPeriodEndDate !== undefined) {
      data.trialPeriodEndDate = dto.trialPeriodEndDate
        ? new Date(dto.trialPeriodEndDate)
        : null;
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.signedByEmployee !== undefined) {
      data.signedByEmployee = dto.signedByEmployee;
    }
    if (dto.signedByEmployer !== undefined) {
      data.signedByEmployer = dto.signedByEmployer;
    }
    if (dto.notes !== undefined) data.notes = dto.notes || null;

    return this.prisma.contract.update({ where: { id: contractId }, data });
  }

  async remove(orgId: string, memberId: string, contractId: string) {
    await this.ensureContract(orgId, memberId, contractId);
    // Le contrat signé rattaché suit la suppression : sans cela le fichier
    // restait référencé par une ligne pointant sur un contrat disparu.
    await this.prisma.document.deleteMany({
      where: { organizationId: orgId, scope: "contract", scopeId: contractId },
    });
    return this.prisma.contract.delete({ where: { id: contractId } });
  }
}
