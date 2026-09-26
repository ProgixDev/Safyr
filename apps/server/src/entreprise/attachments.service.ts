import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
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
/**
 * Les fonctions serverless plafonnent la réponse à ~4,5 Mo : au-delà, la
 * plateforme coupe avec une erreur opaque. On refuse proprement avant.
 */
export const CONTENU_MAX_OCTETS = 4_000_000;

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

    return this.creerDocument(orgId, uploaderId, {
      name: file.filename,
      storageKey: key,
      mimeType: file.mimetype,
      size: file.buffer.length,
      target,
    });
  }

  /**
   * Rattache un fichier DÉJÀ téléversé (POST /storage/upload) : le front envoie
   * le fichier dès qu'il est choisi, puis n'a plus qu'à le lier à la ligne au
   * moment de « Créer », sans second transfert.
   */
  async link(
    orgId: string,
    uploaderId: string,
    file: { storageKey: string; name: string; mimeType: string; size: number },
    target: { scope: AttachedScope; scopeId: string; slot: string },
  ) {
    // Seules les clés produites par le téléversement de documents sont admises.
    if (
      !file.storageKey.startsWith(`${STORAGE_PREFIX_DOCUMENTS}/`) ||
      file.storageKey.includes("..")
    ) {
      throw new BadRequestException("Clé de fichier invalide");
    }
    // Une clé déjà rattachée par une autre organisation ne peut pas être reprise.
    const autre = await this.prisma.document.findFirst({
      where: {
        storageKey: file.storageKey,
        organizationId: { not: orgId },
      },
      select: { id: true },
    });
    if (autre) throw new ForbiddenException("Fichier non accessible");

    return this.creerDocument(orgId, uploaderId, { ...file, target });
  }

  private async creerDocument(
    orgId: string,
    uploaderId: string,
    d: {
      name: string;
      storageKey: string;
      mimeType: string;
      size: number;
      target: { scope: AttachedScope; scopeId: string; slot: string };
    },
  ) {
    const { target } = d;
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
        name: d.name,
        storageKey: d.storageKey,
        mimeType: d.mimeType,
        size: d.size,
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
      // Le même fichier ré-attaché ne doit pas être supprimé du stockage.
      if (ancien.storageKey !== d.storageKey) {
        await this.storage.deleteObjectSafe(SAFYR_BUCKET, ancien.storageKey);
      }
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

  /**
   * Contenu d'un fichier rattaché, pour l'archive « dossier complet » : le
   * navigateur ne peut pas toujours lire l'URL signée (CORS du bucket). La clé
   * doit appartenir à un document de l'organisation, sinon 404 (on ne révèle
   * pas l'existence d'une clé d'une autre organisation).
   */
  async content(orgId: string, storageKey: string) {
    const document = await this.prisma.document.findFirst({
      where: { storageKey, organizationId: orgId },
      select: { name: true, mimeType: true, size: true },
    });
    if (!document) throw new NotFoundException("Document introuvable");

    if (document.size > CONTENU_MAX_OCTETS) {
      throw new PayloadTooLargeException({
        code: "FILE_TOO_LARGE",
        message: "Fichier trop volumineux pour être servi par l'API",
      });
    }

    const buffer = await this.storage.downloadObject(SAFYR_BUCKET, storageKey);
    return { buffer, name: document.name, mimeType: document.mimeType };
  }
}
