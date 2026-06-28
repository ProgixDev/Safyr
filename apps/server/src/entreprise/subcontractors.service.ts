import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreateSubcontractorDto,
  UpdateSubcontractorDto,
} from "@safyr/schemas/client";

@Injectable()
export class SubcontractorsService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.subcontractor.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  async get(organizationId: string, id: string) {
    const item = await this.prisma.subcontractor.findFirst({
      where: { id, organizationId },
    });
    if (!item) throw new NotFoundException("Sous-traitant introuvable");
    return item;
  }

  create(organizationId: string, data: CreateSubcontractorDto) {
    return this.prisma.subcontractor.create({
      data: { ...data, organizationId },
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateSubcontractorDto,
  ) {
    await this.get(organizationId, id);
    return this.prisma.subcontractor.update({
      where: { id },
      data,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.get(organizationId, id);
    return this.prisma.subcontractor.delete({ where: { id } });
  }
}
