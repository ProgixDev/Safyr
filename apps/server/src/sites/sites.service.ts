import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreateSiteDto,
  UpdateSiteDto,
  CreatePostDto,
  UpdatePostDto,
} from "@safyr/schemas/site";

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.site.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      include: { posts: { orderBy: { name: "asc" } } },
    });
  }

  async get(organizationId: string, siteId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, organizationId },
      include: { posts: { orderBy: { name: "asc" } } },
    });
    if (!site) throw new NotFoundException("Site introuvable");
    return site;
  }

  create(organizationId: string, data: CreateSiteDto) {
    return this.prisma.site.create({
      data: { ...data, organizationId },
      include: { posts: true },
    });
  }

  async update(
    organizationId: string,
    siteId: string,
    data: UpdateSiteDto,
  ) {
    await this.get(organizationId, siteId);
    return this.prisma.site.update({
      where: { id: siteId },
      data,
      include: { posts: { orderBy: { name: "asc" } } },
    });
  }

  async remove(organizationId: string, siteId: string) {
    await this.get(organizationId, siteId);
    return this.prisma.site.delete({ where: { id: siteId } });
  }

  // --- Posts ---

  async createPost(
    organizationId: string,
    siteId: string,
    data: CreatePostDto,
  ) {
    await this.get(organizationId, siteId);
    return this.prisma.post.create({
      data: { ...data, siteId },
    });
  }

  async updatePost(
    organizationId: string,
    siteId: string,
    postId: string,
    data: UpdatePostDto,
  ) {
    await this.get(organizationId, siteId);
    const post = await this.prisma.post.findFirst({
      where: { id: postId, siteId },
    });
    if (!post) throw new NotFoundException("Poste introuvable");
    return this.prisma.post.update({ where: { id: postId }, data });
  }

  async deletePost(
    organizationId: string,
    siteId: string,
    postId: string,
  ) {
    await this.get(organizationId, siteId);
    const post = await this.prisma.post.findFirst({
      where: { id: postId, siteId },
    });
    if (!post) throw new NotFoundException("Poste introuvable");
    return this.prisma.post.delete({ where: { id: postId } });
  }
}
