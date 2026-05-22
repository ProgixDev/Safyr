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
  CreateShiftSchema,
  ListShiftsQuerySchema,
  UpdateShiftSchema,
} from "@safyr/schemas/shift";
import { ShiftsService } from "./shifts.service";

@Controller("shifts")
@UseGuards(AuthGuard)
export class ShiftsController {
  constructor(
    private readonly shifts: ShiftsService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest, @Query() query: unknown) {
    const q = parseOrThrow(ListShiftsQuerySchema, query ?? {});
    return this.shifts.list(await this.orgId(req), q);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(CreateShiftSchema, body);
    return this.shifts.create(await this.orgId(req), data);
  }

  @Patch(":shiftId")
  async update(
    @Req() req: FastifyRequest,
    @Param("shiftId") shiftId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdateShiftSchema, body);
    return this.shifts.update(await this.orgId(req), shiftId, data);
  }

  @Delete(":shiftId")
  async remove(
    @Req() req: FastifyRequest,
    @Param("shiftId") shiftId: string,
  ) {
    return this.shifts.remove(await this.orgId(req), shiftId);
  }
}
