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
  ShiftTemplateSchema,
  UpdateShiftTemplateSchema,
  type ShiftTemplateDto,
  type UpdateShiftTemplateDto,
} from "@safyr/schemas/contract";

/** Modeles de vacation reutilisables, definis par site. */
@Controller("shift-templates")
@UseGuards(AuthGuard)
export class ShiftTemplatesController {
  constructor(private readonly prisma: PrismaService) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest) {
    return this.prisma.shiftTemplate.findMany({
      where: { organizationId: await this.orgId(req) },
      orderBy: { startTime: "asc" },
    });
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const dto = parseOrThrow(ShiftTemplateSchema, body) as ShiftTemplateDto;
    return this.prisma.shiftTemplate.create({
      data: {
        organizationId: await this.orgId(req),
        siteId: dto.siteId,
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        breakDuration: dto.breakDuration ?? 0,
        color: dto.color ?? "#3b82f6",
      },
    });
  }

  @Patch(":id")
  async update(
    @Req() req: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const dto = parseOrThrow(
      UpdateShiftTemplateSchema,
      body,
    ) as UpdateShiftTemplateDto;
    const orgId = await this.orgId(req);
    await this.prisma.shiftTemplate.findFirstOrThrow({
      where: { id, organizationId: orgId },
    });
    return this.prisma.shiftTemplate.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  async remove(@Req() req: FastifyRequest, @Param("id") id: string) {
    const orgId = await this.orgId(req);
    await this.prisma.shiftTemplate.findFirstOrThrow({
      where: { id, organizationId: orgId },
    });
    return this.prisma.shiftTemplate.delete({ where: { id } });
  }
}
