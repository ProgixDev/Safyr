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
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  GenerateInvoiceSchema,
  type CreateInvoiceDto,
  type UpdateInvoiceDto,
  type GenerateInvoiceDto,
} from "@safyr/schemas/billing";
import { BillingService } from "./billing.service";

@Controller("billing/invoices")
@UseGuards(AuthGuard)
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest) {
    return this.billing.list(await this.orgId(req));
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const dto = parseOrThrow(CreateInvoiceSchema, body) as CreateInvoiceDto;
    return this.billing.create(await this.orgId(req), dto);
  }

  /** Facture construite a partir des vacations du planning. */
  @Post("from-planning")
  async generer(@Req() req: FastifyRequest, @Body() body: unknown) {
    const dto = parseOrThrow(
      GenerateInvoiceSchema,
      body,
    ) as GenerateInvoiceDto;
    return this.billing.genererDepuisPlanning(await this.orgId(req), dto);
  }

  @Get(":invoiceId")
  async get(
    @Req() req: FastifyRequest,
    @Param("invoiceId") invoiceId: string,
  ) {
    return this.billing.get(await this.orgId(req), invoiceId);
  }

  @Patch(":invoiceId")
  async update(
    @Req() req: FastifyRequest,
    @Param("invoiceId") invoiceId: string,
    @Body() body: unknown,
  ) {
    const dto = parseOrThrow(UpdateInvoiceSchema, body) as UpdateInvoiceDto;
    return this.billing.update(await this.orgId(req), invoiceId, dto);
  }

  @Delete(":invoiceId")
  async remove(
    @Req() req: FastifyRequest,
    @Param("invoiceId") invoiceId: string,
  ) {
    return this.billing.remove(await this.orgId(req), invoiceId);
  }
}
