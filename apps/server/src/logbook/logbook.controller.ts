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
import { requireUserId, resolveOrgId } from "@/common/org-context";
import {
  CreateLogbookEventSchema,
  ListLogbookEventsQuerySchema,
  UpdateLogbookEventSchema,
  ValidateLogbookEventSchema,
} from "@safyr/schemas/logbook";
import { LogbookService } from "./logbook.service";

@Controller("logbook/events")
@UseGuards(AuthGuard)
export class LogbookController {
  constructor(
    private readonly logbook: LogbookService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest, @Query() query: unknown) {
    const q = parseOrThrow(ListLogbookEventsQuerySchema, query ?? {});
    return this.logbook.list(await this.orgId(req), q);
  }

  @Get("mine")
  async mine(@Req() req: FastifyRequest) {
    return this.logbook.getMyOpenForCurrentVacation(
      await this.orgId(req),
      requireUserId(req),
    );
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(CreateLogbookEventSchema, body);
    return this.logbook.create(
      await this.orgId(req),
      requireUserId(req),
      data,
    );
  }

  @Patch(":eventId")
  async update(
    @Req() req: FastifyRequest,
    @Param("eventId") eventId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdateLogbookEventSchema, body);
    return this.logbook.update(await this.orgId(req), eventId, data);
  }

  @Post(":eventId/validate")
  async validate(
    @Req() req: FastifyRequest,
    @Param("eventId") eventId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(ValidateLogbookEventSchema, body);
    return this.logbook.validate(
      await this.orgId(req),
      requireUserId(req),
      eventId,
      data,
    );
  }

  @Delete(":eventId")
  async remove(
    @Req() req: FastifyRequest,
    @Param("eventId") eventId: string,
  ) {
    return this.logbook.remove(await this.orgId(req), eventId);
  }
}
