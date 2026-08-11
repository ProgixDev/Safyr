import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  GenerateInvoiceDto,
} from "@safyr/schemas/billing";

/** Arrondi monétaire à deux décimales. */
function euros(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Durée légale hebdomadaire au-delà de laquelle les heures sont majorées. */
const SEUIL_HEBDO = 35;

/**
 * Identifiant de la semaine civile (lundi → dimanche) d'une date, du type
 * « 2026-W33 ». Sert à remettre le compteur d'heures à zéro chaque semaine.
 */
function cleSemaine(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // Jeudi de la semaine courante : détermine l'année ISO.
  const jour = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - jour + 3);
  const premierJeudi = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const decalage = (premierJeudi.getUTCDay() + 6) % 7;
  premierJeudi.setUTCDate(premierJeudi.getUTCDate() - decalage + 3);
  const semaine =
    1 + Math.round((d.getTime() - premierJeudi.getTime()) / (7 * 86_400_000));
  return `${d.getUTCFullYear()}-W${String(semaine).padStart(2, "0")}`;
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  list(orgId: string) {
    return this.prisma.invoice.findMany({
      where: { organizationId: orgId },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(orgId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
      include: { lines: true },
    });
    if (!invoice) throw new NotFoundException("Facture introuvable");
    return invoice;
  }

  /** Numéro séquentiel par année : FAC-2026-0001. */
  private async prochainNumero(orgId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const prefixe = `FAC-${annee}-`;
    const derniere = await this.prisma.invoice.findFirst({
      where: { organizationId: orgId, invoiceNumber: { startsWith: prefixe } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    const rang = derniere
      ? Number(derniere.invoiceNumber.slice(prefixe.length)) + 1
      : 1;
    return `${prefixe}${String(rang).padStart(4, "0")}`;
  }

  private totaux(
    lignes: { quantity: number; unitPrice: number }[],
    vatRate: number,
  ) {
    const subtotal = euros(
      lignes.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
    );
    const vatAmount = euros((subtotal * vatRate) / 100);
    return { subtotal, vatAmount, total: euros(subtotal + vatAmount) };
  }

  async create(orgId: string, dto: CreateInvoiceDto) {
    const vatRate = dto.vatRate ?? 20;
    const { subtotal, vatAmount, total } = this.totaux(dto.lines, vatRate);

    return this.prisma.invoice.create({
      data: {
        organizationId: orgId,
        invoiceNumber: await this.prochainNumero(orgId),
        clientId: dto.clientId,
        clientName: dto.clientName,
        siteId: dto.siteId ?? null,
        siteName: dto.siteName ?? null,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        status: dto.status ?? "draft",
        vatRate,
        subtotal,
        vatAmount,
        total,
        notes: dto.notes ?? null,
        lines: {
          create: dto.lines.map((l) => ({
            label: l.label,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: euros(l.quantity * l.unitPrice),
            siteId: l.siteId ?? null,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async update(orgId: string, invoiceId: string, dto: UpdateInvoiceDto) {
    await this.get(orgId, invoiceId);
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
        ...(dto.paidAt !== undefined ? { paidAt: new Date(dto.paidAt) } : {}),
        ...(dto.paymentDueDate !== undefined
          ? { paymentDueDate: new Date(dto.paymentDueDate) }
          : {}),
        ...(dto.status === "sent" ? { issuedAt: new Date() } : {}),
      },
      include: { lines: true },
    });
  }

  async remove(orgId: string, invoiceId: string) {
    await this.get(orgId, invoiceId);
    return this.prisma.invoice.delete({ where: { id: invoiceId } });
  }

  /**
   * Construit une facture a partir des vacations planifiees sur la periode,
   * pour tous les sites rattaches au client. Au-dela de 35 h sur une meme
   * semaine civile pour un meme agent, les heures sont majorees de 25 %,
   * comme le prevoit la duree legale du travail.
   */
  async genererDepuisPlanning(orgId: string, dto: GenerateInvoiceDto) {
    const debut = new Date(dto.periodStart);
    const fin = new Date(dto.periodEnd);

    const vacations = await this.prisma.shift.findMany({
      where: {
        organizationId: orgId,
        startAt: { gte: debut },
        endAt: { lte: fin },
        post: { site: { clientName: dto.clientName } },
      },
      include: { post: { include: { site: true } } },
    });

    if (vacations.length === 0) {
      throw new NotFoundException(
        `Aucune vacation planifiée pour « ${dto.clientName} » sur cette période`,
      );
    }

    // Repartition normales / majorees : compteur de 35 h par agent et par
    // semaine civile, alimente dans l'ordre chronologique des vacations.
    const parSite = new Map<
      string,
      { nom: string; normales: number; majorees: number }
    >();
    const compteurs = new Map<string, number>();
    const chronologiques = [...vacations].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

    for (const v of chronologiques) {
      const site = v.post.site;
      const heures =
        (new Date(v.endAt).getTime() - new Date(v.startAt).getTime()) /
        3_600_000;

      // Une vacation non affectee est comptee sur le poste qu'elle occupe.
      const cle = `${v.memberId ?? `poste:${v.postId}`}|${cleSemaine(
        new Date(v.startAt),
      )}`;
      const dejaFaites = compteurs.get(cle) ?? 0;
      const normales = Math.max(0, Math.min(heures, SEUIL_HEBDO - dejaFaites));
      const majorees = heures - normales;
      compteurs.set(cle, dejaFaites + heures);

      const courant = parSite.get(site.id) ?? {
        nom: site.name,
        normales: 0,
        majorees: 0,
      };
      courant.normales += normales;
      courant.majorees += majorees;
      parSite.set(site.id, courant);
    }

    const lignes: {
      label: string;
      quantity: number;
      unitPrice: number;
      siteId: string;
    }[] = [];
    let heuresNormales = 0;
    let heuresMajorees = 0;

    for (const [siteId, { nom, normales, majorees }] of parSite) {
      heuresNormales += normales;
      heuresMajorees += majorees;

      if (normales > 0) {
        lignes.push({
          label: `${nom} — heures de surveillance`,
          quantity: euros(normales),
          unitPrice: dto.hourlyRate,
          siteId,
        });
      }
      if (majorees > 0) {
        lignes.push({
          label: `${nom} — heures majorées (+25 %)`,
          quantity: euros(majorees),
          unitPrice: euros(dto.hourlyRate * 1.25),
          siteId,
        });
      }
    }

    const vatRate = dto.vatRate ?? 20;
    const { subtotal, vatAmount, total } = this.totaux(lignes, vatRate);
    const totalHeures = euros(heuresNormales + heuresMajorees);
    const premierSite = [...parSite.entries()][0];

    // La fiche client d'Entreprise, quand elle existe, sert de référence.
    const client = await this.prisma.client.findFirst({
      where: { organizationId: orgId, name: dto.clientName },
      select: { id: true },
    });

    return this.prisma.invoice.create({
      data: {
        organizationId: orgId,
        invoiceNumber: await this.prochainNumero(orgId),
        clientId: client?.id ?? dto.clientName,
        clientName: dto.clientName,
        siteId: parSite.size === 1 ? premierSite[0] : null,
        siteName: parSite.size === 1 ? premierSite[1].nom : null,
        periodStart: debut,
        periodEnd: fin,
        status: "draft",
        planningHours: totalHeures,
        normalHours: euros(heuresNormales),
        overtimeHours: euros(heuresMajorees),
        hourlyRate: dto.hourlyRate,
        vatRate,
        subtotal,
        vatAmount,
        total,
        lines: {
          create: lignes.map((l) => ({
            label: l.label,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: euros(l.quantity * l.unitPrice),
            siteId: l.siteId,
          })),
        },
      },
      include: { lines: true },
    });
  }
}
