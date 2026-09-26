import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
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

const LinkAttachmentSchema = AttachDocumentSchema.extend({
  storageKey: z.string().trim().min(1).max(300),
  name: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  size: z.number().int().min(0),
});

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

  /**
   * Sert le fichier brut (hors enveloppe JSON, d'où @Res). Déclarée avant
   * toute route à paramètre pour ne pas être confondue avec un identifiant.
   */
  @Get("content")
  async content(
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
    @Query("key") key?: string,
  ): Promise<void> {
    if (!key) throw new BadRequestException("Paramètre « key » manquant");
    const file = await this.attachments.content(await this.orgId(req), key);
    reply
      .header("Content-Type", file.mimeType || "application/octet-stream")
      .header("Content-Length", file.buffer.length)
      .header("Cache-Control", "private, no-store")
      .header("X-Content-Type-Options", "nosniff")
      .send(file.buffer);
  }

  @Post()
  async attach(@Req() req: FastifyRequest) {
    const session = req.authSession;
    if (!session?.user) throw new ForbiddenException("Aucune session active");

    const data = await req.file();
    if (!data) throw new BadRequestException("Aucun fichier reçu");

    const fields = data.fields as Record<
      string,
      { value?: string } | undefined
    >;
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

  // Rattache un fichier déjà téléversé via /storage/upload (JSON, sans fichier).
  @Post("link")
  async link(@Req() req: FastifyRequest, @Body() body: unknown) {
    const session = req.authSession;
    if (!session?.user) throw new ForbiddenException("Aucune session active");
    const { storageKey, name, mimeType, size, ...target } = parseOrThrow(
      LinkAttachmentSchema,
      body,
    );
    return this.attachments.link(
      await this.orgId(req),
      session.user.id,
      { storageKey, name, mimeType, size },
      target,
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
