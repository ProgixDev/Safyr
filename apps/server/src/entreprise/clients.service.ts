import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { CreateClientDto, UpdateClientDto } from "@safyr/schemas/client";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.client.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  async get(organizationId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, organizationId },
    });
    if (!client) throw new NotFoundException("Client introuvable");
    return client;
  }

  create(organizationId: string, data: CreateClientDto) {
    return this.prisma.client.create({
      data: { ...data, organizationId },
    });
  }

  async update(organizationId: string, clientId: string, data: UpdateClientDto) {
    await this.get(organizationId, clientId);
    return this.prisma.client.update({
      where: { id: clientId },
      data,
    });
  }

  async remove(organizationId: string, clientId: string) {
    await this.get(organizationId, clientId);
    return this.prisma.client.delete({ where: { id: clientId } });
  }
}
