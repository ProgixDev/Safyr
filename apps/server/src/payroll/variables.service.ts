import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreatePayrollVariableDto,
  UpdatePayrollVariableDto,
} from "@safyr/schemas/payroll";

@Injectable()
export class VariablesService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.payrollVariable.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(organizationId: string, id: string) {
    const variable = await this.prisma.payrollVariable.findFirst({
      where: { id, organizationId },
    });
    if (!variable) throw new NotFoundException("Variable introuvable");
    return variable;
  }

  create(organizationId: string, data: CreatePayrollVariableDto) {
    return this.prisma.payrollVariable.create({
      data: { ...data, organizationId },
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdatePayrollVariableDto,
  ) {
    await this.get(organizationId, id);
    return this.prisma.payrollVariable.update({
      where: { id },
      data,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.get(organizationId, id);
    return this.prisma.payrollVariable.delete({ where: { id } });
  }
}
