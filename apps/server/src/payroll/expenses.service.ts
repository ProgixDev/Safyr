import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreateExpenseReportDto,
  UpdateExpenseReportDto,
} from "@safyr/schemas/payroll";

/** Strips `undefined` so the value is a valid Prisma JSON input. */
function toJson(value: unknown): object {
  return JSON.parse(JSON.stringify(value ?? []));
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.expenseReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(organizationId: string, id: string) {
    const report = await this.prisma.expenseReport.findFirst({
      where: { id, organizationId },
    });
    if (!report) throw new NotFoundException("Note de frais introuvable");
    return report;
  }

  create(organizationId: string, data: CreateExpenseReportDto) {
    const { items, ...rest } = data;
    return this.prisma.expenseReport.create({
      data: {
        ...rest,
        organizationId,
        items: toJson(items),
        submittedAt: rest.status === "submitted" ? new Date() : null,
      },
    });
  }

  async update(organizationId: string, id: string, data: UpdateExpenseReportDto) {
    await this.get(organizationId, id);
    const { items, ...rest } = data;
    return this.prisma.expenseReport.update({
      where: { id },
      data: {
        ...rest,
        ...(items !== undefined ? { items: toJson(items) } : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.get(organizationId, id);
    return this.prisma.expenseReport.delete({ where: { id } });
  }
}
