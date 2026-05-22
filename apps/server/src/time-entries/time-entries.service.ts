import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  ClockInDto,
  ClockOutDto,
  ListTimeEntriesQuery,
} from "@safyr/schemas/time-entry";

@Injectable()
export class TimeEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveMemberId(
    organizationId: string,
    userId: string,
  ): Promise<string> {
    const member = await this.prisma.member.findFirst({
      where: { organizationId, userId },
      select: { id: true },
    });
    if (!member) {
      throw new NotFoundException("Aucun dossier salarié pour cet utilisateur");
    }
    return member.id;
  }

  async clockIn(
    organizationId: string,
    userId: string,
    data: ClockInDto,
  ) {
    const memberId = await this.resolveMemberId(organizationId, userId);

    const open = await this.prisma.timeEntry.findFirst({
      where: { organizationId, memberId, clockOutAt: null },
      select: { id: true },
    });
    if (open) {
      throw new BadRequestException(
        "Une vacation est déjà ouverte — veuillez la clôturer d'abord",
      );
    }

    return this.prisma.timeEntry.create({
      data: {
        organizationId,
        memberId,
        siteName: data.siteName ?? null,
        source: data.source,
        clockInAt: new Date(),
        clockInLat: data.latitude ?? null,
        clockInLng: data.longitude ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  async clockOut(
    organizationId: string,
    userId: string,
    data: ClockOutDto,
  ) {
    const memberId = await this.resolveMemberId(organizationId, userId);

    const open = await this.prisma.timeEntry.findFirst({
      where: { organizationId, memberId, clockOutAt: null },
      orderBy: { clockInAt: "desc" },
    });
    if (!open) {
      throw new BadRequestException("Aucune vacation en cours");
    }

    return this.prisma.timeEntry.update({
      where: { id: open.id },
      data: {
        clockOutAt: new Date(),
        clockOutLat: data.latitude ?? open.clockOutLat,
        clockOutLng: data.longitude ?? open.clockOutLng,
        notes: data.notes ?? open.notes,
      },
    });
  }

  async getActive(organizationId: string, userId: string) {
    const memberId = await this.resolveMemberId(organizationId, userId);
    return this.prisma.timeEntry.findFirst({
      where: { organizationId, memberId, clockOutAt: null },
      orderBy: { clockInAt: "desc" },
    });
  }

  async activePositions(organizationId: string) {
    return this.prisma.timeEntry.findMany({
      where: { organizationId, clockOutAt: null },
      orderBy: { clockInAt: "desc" },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
          },
        },
      },
    });
  }

  async list(organizationId: string, query: ListTimeEntriesQuery) {
    const where: Record<string, unknown> = { organizationId };
    if (query.memberId) where.memberId = query.memberId;
    if (query.status === "open") where.clockOutAt = null;
    if (query.status === "closed") where.clockOutAt = { not: null };

    if (query.from || query.to) {
      const range: Record<string, Date> = {};
      if (query.from) range.gte = new Date(query.from);
      if (query.to) range.lte = new Date(query.to);
      where.clockInAt = range;
    }

    return this.prisma.timeEntry.findMany({
      where,
      orderBy: { clockInAt: "desc" },
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
      },
    });
  }
}
