import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreateShiftDto,
  ListShiftsQuery,
  UpdateShiftDto,
} from "@safyr/schemas/shift";

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPost(organizationId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, site: { organizationId } },
      select: { id: true },
    });
    if (!post) throw new NotFoundException("Poste introuvable");
  }

  private async assertMember(
    organizationId: string,
    memberId: string,
  ) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException("Agent introuvable");
  }

  async list(organizationId: string, q: ListShiftsQuery) {
    const where: Record<string, unknown> = { organizationId };
    if (q.postId) where.postId = q.postId;
    if (q.memberId) where.memberId = q.memberId;
    if (q.status) where.status = q.status;

    if (q.from || q.to) {
      const range: Record<string, Date> = {};
      if (q.from) range.gte = new Date(q.from);
      if (q.to) range.lte = new Date(q.to);
      where.startAt = range;
    }

    if (q.siteId) {
      where.post = { siteId: q.siteId };
    }

    return this.prisma.shift.findMany({
      where,
      orderBy: { startAt: "asc" },
      take: 500,
      include: {
        post: {
          select: {
            id: true,
            name: true,
            site: {
              select: { id: true, name: true, clientName: true },
            },
          },
        },
      },
    });
  }

  async create(organizationId: string, data: CreateShiftDto) {
    await this.assertPost(organizationId, data.postId);
    if (data.memberId) await this.assertMember(organizationId, data.memberId);

    return this.prisma.shift.create({
      data: {
        organizationId,
        postId: data.postId,
        memberId: data.memberId ?? null,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        status: data.status,
        notes: data.notes ?? null,
      },
      include: {
        post: {
          select: {
            id: true,
            name: true,
            site: { select: { id: true, name: true, clientName: true } },
          },
        },
      },
    });
  }

  async update(
    organizationId: string,
    shiftId: string,
    data: UpdateShiftDto,
  ) {
    const existing = await this.prisma.shift.findFirst({
      where: { id: shiftId, organizationId },
    });
    if (!existing) throw new NotFoundException("Vacation introuvable");

    if (data.postId) await this.assertPost(organizationId, data.postId);
    if (data.memberId)
      await this.assertMember(organizationId, data.memberId);

    const startAt = data.startAt ? new Date(data.startAt) : existing.startAt;
    const endAt = data.endAt ? new Date(data.endAt) : existing.endAt;
    if (endAt <= startAt) {
      throw new BadRequestException("La fin doit être après le début");
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        postId: data.postId ?? undefined,
        memberId:
          data.memberId === undefined ? undefined : data.memberId ?? null,
        startAt,
        endAt,
        status: data.status ?? undefined,
        notes: data.notes === undefined ? undefined : data.notes ?? null,
      },
      include: {
        post: {
          select: {
            id: true,
            name: true,
            site: { select: { id: true, name: true, clientName: true } },
          },
        },
      },
    });
  }

  async remove(organizationId: string, shiftId: string) {
    const existing = await this.prisma.shift.findFirst({
      where: { id: shiftId, organizationId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException("Vacation introuvable");
    return this.prisma.shift.delete({ where: { id: shiftId } });
  }
}
