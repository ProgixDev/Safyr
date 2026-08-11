import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
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
  AttachDocumentSchema,
  AttachedScopeSchema,
  type AttachDocumentDto,
} from "@safyr/schemas/contract";
import { AttachmentsService } from "./attachments.service";

@Controller("organization/attachments")
@UseGuards(AuthGuard)
export class AttachmentsController {
  constructor(
    private readonly attachments: AttachmentsService,
    private readonly prisma: PrismaService,
  ) {}

  private orgId(req: FastifyRequest): Promise<string> {
    return resolveOrgId(req, this.prisma);
  }

  @Get()
  async list(
    @Req() req: FastifyRequest,
    @Query("scope") scope: string,
    @Query("scopeId") scopeId?: string,
  ) {
    const parsed = AttachedScopeSchema.safeParse(scope);
    if (!parsed.success) {
      throw new BadRequestException("Paramètre « scope » invalide");
    }
    return this.attachments.list(await this.orgId(req), parsed.data, scopeId);
  }

  @Post()
  async attach(@Req() req: FastifyRequest) {
    const session = req.authSession;
    if (!session?.user) throw new ForbiddenException("Aucune session active");

    const data = await req.file();
    if (!data) throw new BadRequestException("Aucun fichier reçu");

    const fields = data.fields as Record<string, { value?: string } | undefined>;
    const dto = parseOrThrow(AttachDocumentSchema, {
      scope: fields.scope?.value,
      scopeId: fields.scopeId?.value,
      slot: fields.slot?.value,
    }) as AttachDocumentDto;

    const buffer = await data.toBuffer();

    return this.attachments.attach(
      await this.orgId(req),
      session.user.id,
      { buffer, filename: data.filename, mimetype: data.mimetype },
      dto,
    );
  }

  @Delete(":documentId")
  async remove(
    @Req() req: FastifyRequest,
    @Param("documentId") documentId: string,
  ) {
    return this.attachments.remove(await this.orgId(req), documentId);
  }
}
