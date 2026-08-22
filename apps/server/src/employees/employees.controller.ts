import {
  BadRequestException,
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
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  CreateCertificationSchema,
  UpdateCertificationSchema,
  UploadMemberDocumentSchema,
  type CreateEmployeeDto,
  type UpdateEmployeeDto,
  type CreateCertificationDto,
  type UpdateCertificationDto,
} from "@safyr/schemas/employee";
import { EmployeesService } from "./employees.service";
import { parseOrThrow } from "@/common/parse-or-throw";
import { resolveOrgId, requireUserId } from "@/common/org-context";

@Controller("organization/employees")
@UseGuards(AuthGuard)
export class EmployeesController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly prisma: PrismaService,
  ) {}

  private getOrgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(@Req() req: FastifyRequest) {
    return this.employees.list(await this.getOrgId(req));
  }

  @Get("stats")
  async stats(@Req() req: FastifyRequest) {
    return this.employees.stats(await this.getOrgId(req));
  }

  @Get(":memberId")
  async get(@Req() req: FastifyRequest, @Param("memberId") memberId: string) {
    return this.employees.get(await this.getOrgId(req), memberId);
  }

  @Get(":memberId/compliance")
  async compliance(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
  ) {
    return this.employees.listMemberCompliance(
      await this.getOrgId(req),
      memberId,
    );
  }

  @Post()
  async create(@Req() req: FastifyRequest, @Body() body: unknown) {
    const data = parseOrThrow(CreateEmployeeSchema, body);
    return this.employees.create(
      await this.getOrgId(req),
      data as CreateEmployeeDto,
    );
  }

  @Patch(":memberId")
  async update(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdateEmployeeSchema, body);
    return this.employees.update(
      await this.getOrgId(req),
      memberId,
      data as UpdateEmployeeDto,
    );
  }

  @Delete(":memberId")
  async remove(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
  ) {
    return this.employees.softDelete(await this.getOrgId(req), memberId);
  }

  @Post(":memberId/resend-invite")
  async resendInvite(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
  ) {
    return this.employees.resendInvite(await this.getOrgId(req), memberId);
  }

  @Post(":memberId/documents")
  async uploadDocument(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
  ) {
    const uploaderId = requireUserId(req);

    const file = await req.file();
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const fields = file.fields as Record<
      string,
      { value?: string } | undefined
    >;
    const payload = {
      requirementId: fields.requirementId?.value,
      expiryDate: fields.expiryDate?.value,
    };
    const parsed = parseOrThrow(UploadMemberDocumentSchema, payload);

    const buffer = await file.toBuffer();

    return this.employees.uploadMemberDocument(
      await this.getOrgId(req),
      memberId,
      uploaderId,
      {
        buffer,
        filename: file.filename,
        mimetype: file.mimetype,
      },
      parsed.requirementId,
      parsed.expiryDate,
    );
  }

  @Post(":memberId/certifications")
  async createCertification(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(CreateCertificationSchema, body);
    return this.employees.createCertification(
      await this.getOrgId(req),
      memberId,
      data as CreateCertificationDto,
    );
  }

  @Patch(":memberId/certifications/:certId")
  async updateCertification(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
    @Param("certId") certId: string,
    @Body() body: unknown,
  ) {
    const data = parseOrThrow(UpdateCertificationSchema, body);
    return this.employees.updateCertification(
      await this.getOrgId(req),
      memberId,
      certId,
      data as UpdateCertificationDto,
    );
  }

  @Delete(":memberId/documents/:requirementId")
  async deleteDocument(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
    @Param("requirementId") requirementId: string,
  ) {
    return this.employees.deleteMemberDocument(
      await this.getOrgId(req),
      memberId,
      requirementId,
    );
  }

  @Delete(":memberId/certifications/:certId")
  async deleteCertification(
    @Req() req: FastifyRequest,
    @Param("memberId") memberId: string,
    @Param("certId") certId: string,
  ) {
    return this.employees.deleteCertification(
      await this.getOrgId(req),
      memberId,
      certId,
    );
  }
}
