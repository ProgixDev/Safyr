import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  StorageService,
  SAFYR_BUCKET,
  STORAGE_PREFIX_DOCUMENTS,
} from "@/storage/storage.service";
import type { AttachedScope } from "@safyr/schemas/contract";

/**
 * Documents rattachés aux modules qui n'ont pas de table propre :
 * sous-traitants, dossiers fiscaux (TVA, CFE, prélèvement, courriers) et
 * dossiers AKTO/OPCO. On réutilise la table `document` avec un rattachement
 * générique (scope / scopeId / slot) plutôt qu'une table par module.
 */
@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  list(orgId: string, scope: AttachedScope, scopeId?: string) {
    return this.prisma.document.findMany({
      where: {
        organizationId: orgId,
        scope,
        ...(scopeId ? { scopeId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Attache un fichier à une ligne. Un même emplacement (scope/scopeId/slot)
   * ne porte qu'un document : le précédent est remplacé et son fichier retiré
   * du stockage.
   */
  async attach(
    orgId: string,
    uploaderId: string,
    file: { buffer: Buffer; filename: string; mimetype: string },
    target: { scope: AttachedScope; scopeId: string; slot: string },
  ) {
    const key = this.storage.buildStorageKey(
      STORAGE_PREFIX_DOCUMENTS,
      file.filename,
    );

    await this.storage.uploadObject(SAFYR_BUCKET, key, file.buffer, {
      contentType: file.mimetype,
      metadata: {
        uploaderId,
        entityType: "document",
        originalName: file.filename,
        mimeType: file.mimetype,
      },
    });

    const existants = await this.prisma.document.findMany({
      where: {
        organizationId: orgId,
        scope: target.scope,
        scopeId: target.scopeId,
        slot: target.slot,
      },
    });

    const document = await this.prisma.document.create({
      data: {
        name: file.filename,
        storageKey: key,
        mimeType: file.mimetype,
        size: file.buffer.length,
        status: "valid",
        organizationId: orgId,
        uploaderId,
        scope: target.scope,
        scopeId: target.scopeId,
        slot: target.slot,
      },
    });

    for (const ancien of existants) {
      await this.prisma.document.delete({ where: { id: ancien.id } });
      await this.storage.deleteObjectSafe(SAFYR_BUCKET, ancien.storageKey);
    }

    return document;
  }

  async remove(orgId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, organizationId: orgId },
    });
    if (!document) throw new NotFoundException("Document introuvable");

    await this.prisma.document.delete({ where: { id: documentId } });
    await this.storage.deleteObjectSafe(SAFYR_BUCKET, document.storageKey);
    return { id: documentId };
  }
}
