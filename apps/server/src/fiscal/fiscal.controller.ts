import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthGuard } from "@/auth/auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { parseOrThrow } from "@/common/parse-or-throw";
import { resolveOrgId } from "@/common/org-context";
import {
  CreateFiscalRecordSchema,
  UpdateFiscalRecordSchema,
  FiscalRecordTypeSchema,
  type CreateFiscalRecordDto,
  type UpdateFiscalRecordDto,
} from "@safyr/schemas/fiscal";
import { FiscalService } from "./fiscal.service";

@Controller("organization/fiscal-records")
@UseGuards(AuthGuard)
export class FiscalController {
  constructor(
    private readonly fiscal: FiscalService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(
    @Req() req: FastifyRequest,
    @Query("type") type?: string,
    @Query("period") period?: string,
  ) {
    const parsed = type ? FiscalRecordTypeSchema.safeParse(type) : null;
    return this.fiscal.list(
      await this.orgId(req),
      parsed?.success ? parsed.data : undefined,
      period,
    );
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const dto = parseOrThrow(
      CreateFiscalRecordSchema,
      body,
    ) as CreateFiscalRecordDto;
    return this.fiscal.create(await this.orgId(req), dto);
  }

  @Patch(":recordId")
  async update(
    @Req() req: FastifyRequest,
    @Param("recordId") recordId: string,
    @Body() body: unknown,
  ) {
    const dto = parseOrThrow(
      UpdateFiscalRecordSchema,
      body,
    ) as UpdateFiscalRecordDto;
    return this.fiscal.update(await this.orgId(req), recordId, dto);
  }

  @Delete(":recordId")
  async remove(
    @Req() req: FastifyRequest,
    @Param("recordId") recordId: string,
  ) {
    return this.fiscal.remove(await this.orgId(req), recordId);
  }
}
