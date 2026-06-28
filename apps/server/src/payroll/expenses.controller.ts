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
  CreateExpenseReportSchema,
  UpdateExpenseReportSchema,
} from "@safyr/schemas/payroll";
import { ExpensesService } from "./expenses.service";

@Controller("organization/expenses")
@UseGuards(AuthGuard)
export class ExpensesController {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest) {
    return this.expenses.list(await this.orgId(req));
  }

  @Get(":id")
  async get(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.expenses.get(await this.orgId(req), id);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(CreateExpenseReportSchema, body);
    return this.expenses.create(await this.orgId(req), data);
  }

  @Patch(":id")
  async update(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdateExpenseReportSchema, body);
    return this.expenses.update(await this.orgId(req), id, data);
  }

  @Delete(":id")
  async remove(@Req() req: FastifyRequest, @Param("id") id: string) {
    return this.expenses.remove(await this.orgId(req), id);
  }
}
