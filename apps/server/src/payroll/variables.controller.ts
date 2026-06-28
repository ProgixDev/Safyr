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
  CreatePayrollVariableSchema,
  UpdatePayrollVariableSchema,
} from "@safyr/schemas/payroll";
import { VariablesService } from "./variables.service";

@Controller("organization/payroll-variables")
@UseGuards(AuthGuard)
export class VariablesController {
  constructor(
    private readonly variables: VariablesService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest) {
    return this.variables.list(await this.orgId(req));
  }

  @Get(":id")
  async get(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.variables.get(await this.orgId(req), id);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(CreatePayrollVariableSchema, body);
    return this.variables.create(await this.orgId(req), data);
  }

  @Patch(":id")
  async update(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdatePayrollVariableSchema, body);
    return this.variables.update(await this.orgId(req), id, data);
  }

  @Delete(":id")
  async remove(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.variables.remove(await this.orgId(req), id);
  }
}
