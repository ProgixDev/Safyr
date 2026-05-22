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
  CreateSiteSchema,
  UpdateSiteSchema,
  CreatePostSchema,
  UpdatePostSchema,
} from "@safyr/schemas/site";
import { SitesService } from "./sites.service";

@Controller("sites")
@UseGuards(AuthGuard)
export class SitesController {
  constructor(
    private readonly sites: SitesService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest) {
    return this.sites.list(await this.orgId(req));
  }

  @Get(":siteId")
  async get(@Req() req: FastifyRequest, @Param("siteId") siteId: string) {
    return this.sites.get(await this.orgId(req), siteId);
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(CreateSiteSchema, body);
    return this.sites.create(await this.orgId(req), data);
  }

  @Patch(":siteId")
  async update(
    @Req() req: FastifyRequest,
    @Param("siteId") siteId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdateSiteSchema, body);
    return this.sites.update(await this.orgId(req), siteId, data);
  }

  @Delete(":siteId")
  async remove(@Req() req: FastifyRequest, @Param("siteId") siteId: string) {
    return this.sites.remove(await this.orgId(req), siteId);
  }

  // --- Posts ---

  @Post(":siteId/posts")
  async createPost(
    @Req() req: FastifyRequest,
    @Param("siteId") siteId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(CreatePostSchema, body);
    return this.sites.createPost(await this.orgId(req), siteId, data);
  }

  @Patch(":siteId/posts/:postId")
  async updatePost(
    @Req() req: FastifyRequest,
    @Param("siteId") siteId: string,
    @Param("postId") postId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdatePostSchema, body);
    return this.sites.updatePost(
      await this.orgId(req),
      siteId,
      postId,
      data,
    );
  }

  @Delete(":siteId/posts/:postId")
  async deletePost(
    @Req() req: FastifyRequest,
    @Param("siteId") siteId: string,
    @Param("postId") postId: string,
  ) {
    return this.sites.deletePost(await this.orgId(req), siteId, postId);
  }
}
