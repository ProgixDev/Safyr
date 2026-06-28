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
import {
  CreateSubcontractorSchema,
  UpdateSubcontractorSchema,
} from "@safyr/schemas/client";
import { SubcontractorsService } from "./subcontractors.service";

@Controller("organization/subcontractors")
@UseGuards(AuthGuard)
export class SubcontractorsController {
  constructor(
    private readonly subcontractors: SubcontractorsService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest) {
    return this.subcontractors.list(await this.orgId(req));
  }

  @Get(":id")
  async get(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.subcontractors.get(await this.orgId(req), id);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(CreateSubcontractorSchema, body);
    return this.subcontractors.create(await this.orgId(req), data);
  }

  @Patch(":id")
  async update(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdateSubcontractorSchema, body);
    return this.subcontractors.update(await this.orgId(req), id, data);
  }

  @Delete(":id")
  async remove(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.subcontractors.remove(await this.orgId(req), id);
  }
}
