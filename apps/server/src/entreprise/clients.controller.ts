import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthGuard } from "@/auth/auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { parseOrThrow } from "@/common/parse-or-throw";
import { resolveOrgId } from "@/common/org-context";
import { CreateClientSchema, UpdateClientSchema } from "@safyr/schemas/client";
import { ClientsService } from "./clients.service";

@Controller("organization/clients")
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(
    private readonly clients: ClientsService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest) {
    return this.clients.list(await this.orgId(req));
  }

  @Get(":clientId")
  async get(@Req() req: FastifyRequest, @Param("clientId") clientId: string) {
    return this.clients.get(await this.orgId(req), clientId);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(CreateClientSchema, body);
    return this.clients.create(await this.orgId(req), data);
  }

  @Patch(":clientId")
  async update(
    @Req() req: FastifyRequest,
    @Param("clientId") clientId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdateClientSchema, body);
    return this.clients.update(await this.orgId(req), clientId, data);
  }

  @Delete(":clientId")
  async remove(
    @Req() req: FastifyRequest,
    @Param("clientId") clientId: string,
  ) {
    return this.clients.remove(await this.orgId(req), clientId);
  }
}
