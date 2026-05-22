import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreateLogbookEventDto,
  ListLogbookEventsQuery,
  UpdateLogbookEventDto,
  ValidateLogbookEventDto,
} from "@safyr/schemas/logbook";

@Injectable()
export class LogbookService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveMemberIdForUser(
    organizationId: string,
    userId: string,
  ): Promise<string | null> {
    const member = await this.prisma.member.findFirst({
      where: { organizationId, userId },
      select: { id: true },
    });
    return member?.id ?? null;
  }

  async list(organizationId: string, q: ListLogbookEventsQuery) {
    const where: Record<string, unknown> = { organizationId };
    if (q.memberId) where.memberId = q.memberId;
    if (q.siteId) where.siteId = q.siteId;
    if (q.type) where.type = q.type;
    if (q.severity) where.severity = q.severity;
    if (q.status) where.status = q.status;

    if (q.from || q.to) {
      const range: Record<string, Date> = {};
      if (q.from) range.gte = new Date(q.from);
      if (q.to) range.lte = new Date(q.to);
      where.occurredAt = range;
    }

    return this.prisma.logbookEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 200,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
        site: {
          select: { id: true, name: true, clientName: true },
        },
      },
    });
  }

  async getMyOpenForCurrentVacation(
    organizationId: string,
    userId: string,
  ) {
    const memberId = await this.resolveMemberIdForUser(organizationId, userId);
    if (!memberId) return [];

    return this.prisma.logbookEvent.findMany({
      where: { organizationId, memberId },
      orderBy: { occurredAt: "desc" },
      take: 50,
    });
  }

  async create(
    organizationId: string,
    userId: string,
    data: CreateLogbookEventDto,
  ) {
    const memberId = await this.resolveMemberIdForUser(organizationId, userId);

    let siteId: string | null = data.siteId ?? null;
    if (!siteId && memberId) {
      // Auto-resolve site from current active vacation
      const active = await this.prisma.timeEntry.findFirst({
        where: { organizationId, memberId, clockOutAt: null },
        orderBy: { clockInAt: "desc" },
        select: { siteName: true },
      });
      if (active?.siteName) {
        const matchedSite = await this.prisma.site.findFirst({
          where: { organizationId, name: active.siteName },
          select: { id: true },
        });
        siteId = matchedSite?.id ?? null;
      }
    }

    if (siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: siteId, organizationId },
        select: { id: true },
      });
      if (!site) throw new NotFoundException("Site introuvable");
    }

    return this.prisma.logbookEvent.create({
      data: {
        organizationId,
        memberId: memberId ?? null,
        siteId: siteId ?? null,
        type: data.type,
        category: data.category ?? null,
        severity: data.severity,
        title: data.title,
        description: data.description ?? null,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: "open",
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        site: { select: { id: true, name: true } },
      },
    });
  }

  async update(
    organizationId: string,
    eventId: string,
    data: UpdateLogbookEventDto,
  ) {
    const existing = await this.prisma.logbookEvent.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Événement introuvable");

    return this.prisma.logbookEvent.update({
      where: { id: eventId },
      data: {
        type: data.type ?? undefined,
        category: data.category === undefined ? undefined : data.category ?? null,
        severity: data.severity ?? undefined,
        title: data.title ?? undefined,
        description:
          data.description === undefined ? undefined : data.description ?? null,
      },
    });
  }

  async validate(
    organizationId: string,
    userId: string,
    eventId: string,
    data: ValidateLogbookEventDto,
  ) {
    const existing = await this.prisma.logbookEvent.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Événement introuvable");

    return this.prisma.logbookEvent.update({
      where: { id: eventId },
      data: {
        status: data.status,
        validatorId: userId,
        validatedAt: new Date(),
        validationComment: data.comment ?? null,
      },
    });
  }

  async remove(organizationId: string, eventId: string) {
    const existing = await this.prisma.logbookEvent.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Événement introuvable");
    return this.prisma.logbookEvent.delete({ where: { id: eventId } });
  }
}
