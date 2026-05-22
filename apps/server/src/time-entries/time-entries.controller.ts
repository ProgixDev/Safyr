import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthGuard } from "@/auth/auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { parseOrThrow } from "@/common/parse-or-throw";
import { requireUserId, resolveOrgId } from "@/common/org-context";
import {
  ClockInSchema,
  ClockOutSchema,
  ListTimeEntriesQuerySchema,
} from "@safyr/schemas/time-entry";
import { TimeEntriesService } from "./time-entries.service";

@Controller("time-entries")
@UseGuards(AuthGuard)
export class TimeEntriesController {
  constructor(
    private readonly timeEntries: TimeEntriesService,
    private readonly prisma: PrismaService,
  ) {}

  private getOrgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get("active")
  async active(@Req() req: FastifyRequest) {
    return this.timeEntries.getActive(
      await this.getOrgId(req),
      requireUserId(req),
    );
  }

  @Get("active-positions")
  async activePositions(@Req() req: FastifyRequest) {
    return this.timeEntries.activePositions(await this.getOrgId(req));
  }

  @Post("clock-in")
  async clockIn(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(ClockInSchema, body ?? {});
    return this.timeEntries.clockIn(
      await this.getOrgId(req),
      requireUserId(req),
      data,
    );
  }

  @Post("clock-out")
  async clockOut(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(ClockOutSchema, body ?? {});
    return this.timeEntries.clockOut(
      await this.getOrgId(req),
      requireUserId(req),
      data,
    );
  }

  @Get()
  async list(@Req() req: FastifyRequest, @Query() query: unknown) {
    const parsed = parseOrThrow(ListTimeEntriesQuerySchema, query ?? {});
    return this.timeEntries.list(await this.getOrgId(req), parsed);
  }
}
