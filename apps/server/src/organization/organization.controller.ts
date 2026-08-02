import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { OrganizationService } from "./organization.service";
import {
  UpdateOrganizationSchema,
  CreateRepresentativeSchema,
  UploadDocumentSchema,
  type UpdateOrganizationDto,
  type CreateRepresentativeDto,
} from "@safyr/schemas/organization";
import type { FastifyRequest } from "fastify";
import { PrismaService } from "@/prisma/prisma.service";
import { parseOrThrow } from "@/common/parse-or-throw";
import { resolveOrgId } from "@/common/org-context";

@Controller("organization")
@UseGuards(AuthGuard)
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly prisma: PrismaService,
  ) {}

  private getOrgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async getOrganization(@Req() req: FastifyRequest) {
    return this.organizationService.getOrganization(await this.getOrgId(req));
  }

  @Patch()
  async updateOrganization(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(UpdateOrganizationSchema, body);
    return this.organizationService.updateOrganization(
      await this.getOrgId(req),
      data as UpdateOrganizationDto,
    );
  }

  @Post("representative")
  async createRepresentative(
    @Req() req: FastifyRequest,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(CreateRepresentativeSchema, body);
    return this.organizationService.createRepresentative(
      await this.getOrgId(req),
      data as CreateRepresentativeDto,
    );
  }

  @Get("compliance")
  async getCompliance(@Req() req: FastifyRequest) {
    return this.organizationService.getComplianceReport(
      await this.getOrgId(req),
    );
  }

  @Post("documents")
  async uploadDocument(@Req() req: FastifyRequest) {
    const session = req.authSession;
    if (!session || !session.user) {
      throw new ForbiddenException("No active session found");
    }

    const data = await req.file();
    if (!data) {
      throw new BadRequestException("No file uploaded");
    }

    const fields = data.fields as Record<
      string,
      { value?: string } | undefined
    >;
    const payload = {
      requirementId: fields.requirementId?.value,
      expiryDate: fields.expiryDate?.value,
    };

    const parsed = parseOrThrow(UploadDocumentSchema, payload);

    const buffer = await data.toBuffer();

    return this.organizationService.createOrReplaceDocument(
      await this.getOrgId(req),
      session.user.id,
      {
        buffer,
        filename: data.filename,
        mimetype: data.mimetype,
      },
      parsed.requirementId,
      parsed.expiryDate,
    );
  }

  @Delete("documents/:requirementId")
  async deleteDocument(
    @Req() req: FastifyRequest,
    @Param("requirementId") requirementId: string,
  ) {
    return this.organizationService.deleteDocumentByRequirement(
      await this.getOrgId(req),
      requirementId,
    );
  }
}
