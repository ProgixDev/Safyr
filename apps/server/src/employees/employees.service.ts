import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "@/prisma/prisma.service";
import {
  SAFYR_BUCKET,
  STORAGE_PREFIX_DOCUMENTS,
  StorageService,
} from "@/storage/storage.service";
import { AUTH } from "@/auth/auth.tokens";
import type { Auth } from "@/auth/auth.config";
import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  CreateCertificationDto,
  UpdateCertificationDto,
} from "@safyr/schemas/employee";

import { computeExpiryStatus } from "@/common/document-status";

function toDate(v: string | null | undefined): Date | null {
  return v && v !== "" ? new Date(v) : null;
}

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  private memberInclude = {
    addressRecord: true,
    bankDetails: true,
    certifications: { include: { document: true } },
    documents: { include: { requirement: true } },
    user: { select: { id: true, email: true, name: true, image: true } },
  } as const;

  private listMemberInclude = {
    user: { select: { id: true, email: true, name: true, image: true } },
  } as const;

  async list(orgId: string) {
    return this.prisma.member.findMany({
      where: {
        organizationId: orgId,
        status: { not: "terminated" },
      },
      include: this.listMemberInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async stats(orgId: string) {
    const [total, active] = await Promise.all([
      this.prisma.member.count({
        where: { organizationId: orgId, status: { not: "terminated" } },
      }),
      this.prisma.member.count({
        where: { organizationId: orgId, status: "active" },
      }),
    ]);
    return { total, active };
  }

  async get(orgId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId: orgId },
      include: this.memberInclude,
    });
    if (!member) {
      throw new NotFoundException(`Employee ${memberId} not found`);
    }
    return member;
  }

  async create(orgId: string, dto: CreateEmployeeDto) {
    const [existingMember, empNumberConflict] = await Promise.all([
      this.prisma.member.findFirst({
        where: {
          organizationId: orgId,
          OR: [{ email: dto.email }, { user: { email: dto.email } }],
        },
        select: { id: true },
      }),
      this.prisma.member.findFirst({
        where: { organizationId: orgId, employeeNumber: dto.employeeNumber },
        select: { id: true },
      }),
    ]);
    if (existingMember) {
      throw new ConflictException(
        `Un employé avec l'email ${dto.email} existe déjà`,
      );
    }
    if (empNumberConflict) {
      throw new ConflictException(
        `Numéro d'employé ${dto.employeeNumber} déjà utilisé`,
      );
    }

    const fullName = `${dto.firstName} ${dto.lastName}`.trim();

    const { member, isNewUser } = await this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: dto.email },
      });
      let createdNewUser = false;

      if (!user) {
        user = await tx.user.create({
          data: {
            id: randomUUID(),
            email: dto.email,
            name: fullName,
            emailVerified: false,
            updatedAt: new Date(),
          },
        });
        createdNewUser = true;
      }

      const memberRow = await tx.member.create({
        data: {
          id: randomUUID(),
          organizationId: orgId,
          userId: user.id,
          role: dto.role ?? "agent",
          createdAt: new Date(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone || null,
          birthDate: toDate(dto.dateOfBirth),
          birthPlace: dto.placeOfBirth || null,
          nationality: dto.nationality || null,
          gender: dto.gender || null,
          civilStatus: dto.civilStatus || null,
          children: dto.children ?? null,
          socialSecurityNumber: dto.socialSecurityNumber || null,
          employeeNumber: dto.employeeNumber,
          hireDate: toDate(dto.hireDate),
          position: dto.position,
          contractType: dto.contractType ?? null,
          workSchedule: dto.workSchedule ?? null,
          status: dto.status ?? "active",
          dressingAllowance: dto.dressingAllowance ?? false,
          addressRecord: {
            create: {
              street: dto.address.street,
              city: dto.address.city,
              postalCode: dto.address.postalCode,
              country: dto.address.country || "France",
            },
          },
          bankDetails: {
            create: {
              iban: dto.bankDetails.iban,
              bic: dto.bankDetails.bic,
              bankName: dto.bankDetails.bankName,
            },
          },
        },
        include: this.memberInclude,
      });

      return { member: memberRow, isNewUser: createdNewUser };
    });

    if (isNewUser) {
      await this.sendInviteMagicLink(dto.email);
    }

    return member;
  }

  async resendInvite(orgId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { email: true, user: { select: { email: true } } },
    });
    if (!member) {
      throw new NotFoundException(`Employee ${memberId} not found`);
    }
    const email = member.email ?? member.user.email;
    if (!email) {
      throw new BadRequestException("Employee has no email");
    }
    await this.sendInviteMagicLink(email);
    return { sent: true, email };
  }

  private async sendInviteMagicLink(email: string) {
    try {
      await this.auth.api.signInMagicLink({
        body: { email, callbackURL: "/dashboard" },
        headers: new Headers(),
      });
    } catch (err) {
      this.logger.error(
        `Failed to send invite magic link to ${email}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async update(orgId: string, memberId: string, dto: UpdateEmployeeDto) {
    await this.ensureMember(orgId, memberId);

    const { address, bankDetails, dateOfBirth, hireDate, ...rest } = dto;

    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined) continue;
      data[key] = value === "" ? null : value;
    }
    if (dateOfBirth !== undefined) {
      data.birthDate = toDate(dateOfBirth);
    }
    if (hireDate !== undefined) {
      data.hireDate = toDate(hireDate);
    }
    if ("placeOfBirth" in rest && rest.placeOfBirth !== undefined) {
      data.birthPlace = rest.placeOfBirth === "" ? null : rest.placeOfBirth;
      delete data.placeOfBirth;
    }

    if (dto.employeeNumber) {
      const conflict = await this.prisma.member.findFirst({
        where: {
          organizationId: orgId,
          employeeNumber: dto.employeeNumber,
          NOT: { id: memberId },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new ConflictException(
          `Numéro d'employé ${dto.employeeNumber} déjà utilisé`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.member.update({ where: { id: memberId }, data });

      if (address) {
        await tx.memberAddress.upsert({
          where: { memberId },
          create: {
            memberId,
            street: address.street ?? "",
            city: address.city ?? "",
            postalCode: address.postalCode ?? "",
            country: address.country ?? "France",
          },
          update: {
            ...(address.street !== undefined && { street: address.street }),
            ...(address.city !== undefined && { city: address.city }),
            ...(address.postalCode !== undefined && {
              postalCode: address.postalCode,
            }),
            ...(address.country !== undefined && { country: address.country }),
          },
        });
      }

      if (bankDetails) {
        await tx.memberBankDetails.upsert({
          where: { memberId },
          create: {
            memberId,
            iban: bankDetails.iban ?? "",
            bic: bankDetails.bic ?? "",
            bankName: bankDetails.bankName ?? "",
          },
          update: {
            ...(bankDetails.iban !== undefined && { iban: bankDetails.iban }),
            ...(bankDetails.bic !== undefined && { bic: bankDetails.bic }),
            ...(bankDetails.bankName !== undefined && {
              bankName: bankDetails.bankName,
            }),
          },
        });
      }

      return tx.member.findUniqueOrThrow({
        where: { id: memberId },
        include: this.memberInclude,
      });
    });
  }

  async softDelete(orgId: string, memberId: string) {
    await this.ensureMember(orgId, memberId);
    return this.prisma.member.update({
      where: { id: memberId },
      data: { status: "terminated", terminatedAt: new Date() },
    });
  }

  private async ensureMember(orgId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { id: true },
    });
    if (!member) {
      throw new NotFoundException(`Employee ${memberId} not found`);
    }
  }

  async uploadMemberDocument(
    orgId: string,
    memberId: string,
    uploaderId: string,
    file: { buffer: Buffer; filename: string; mimetype: string },
    requirementId: string,
    expiryDate?: string,
  ) {
    await this.ensureMember(orgId, memberId);

    const requirement = await this.prisma.documentRequirement.findUnique({
      where: { id: requirementId },
    });
    if (!requirement) {
      throw new NotFoundException(`Requirement ${requirementId} not found`);
    }
    if (requirement.targetType !== "MEMBER") {
      throw new BadRequestException(
        `Requirement ${requirementId} is not a member requirement`,
      );
    }

    const existing = await this.prisma.document.findFirst({
      where: { memberId, requirementId },
    });

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

    const expiry = toDate(expiryDate);
    const status = computeExpiryStatus(expiry);

    const document = existing
      ? await this.prisma.document.update({
          where: { id: existing.id },
          data: {
            name: file.filename,
            storageKey: key,
            mimeType: file.mimetype,
            size: file.buffer.length,
            status,
            expiryDate: expiry,
            uploaderId,
          },
        })
      : await this.prisma.document.create({
          data: {
            name: file.filename,
            storageKey: key,
            mimeType: file.mimetype,
            size: file.buffer.length,
            status,
            expiryDate: expiry,
            requirementId,
            memberId,
            uploaderId,
          },
        });

    if (existing && existing.storageKey !== key) {
      await this.storage.deleteObjectSafe(SAFYR_BUCKET, existing.storageKey);
    }

    return document;
  }

  async listMemberCompliance(orgId: string, memberId: string) {
    await this.ensureMember(orgId, memberId);
    const [requirements, documents] = await Promise.all([
      this.prisma.documentRequirement.findMany({
        where: { targetType: "MEMBER" },
      }),
      this.prisma.document.findMany({ where: { memberId } }),
    ]);
    const docByReq = new Map(
      documents.map((d) => [d.requirementId, d] as const),
    );
    return requirements.map((req) => {
      const doc = docByReq.get(req.id) ?? null;
      const status = doc
        ? computeExpiryStatus(doc.expiryDate)
        : req.isRequired
          ? "missing"
          : "optional";
      return { requirement: req, document: doc, status };
    });
  }

  async createCertification(
    orgId: string,
    memberId: string,
    dto: CreateCertificationDto,
  ) {
    await this.ensureMember(orgId, memberId);
    const expiryDate = new Date(dto.expiryDate);
    return this.prisma.certification.create({
      data: {
        memberId,
        type: dto.type,
        number: dto.number,
        issuer: dto.issuer,
        issueDate: new Date(dto.issueDate),
        expiryDate,
        verified: dto.verified ?? false,
        status: computeExpiryStatus(expiryDate),
      },
    });
  }

  async updateCertification(
    orgId: string,
    memberId: string,
    certId: string,
    dto: UpdateCertificationDto,
  ) {
    await this.ensureCertification(orgId, memberId, certId);

    const data: Record<string, unknown> = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.issuer !== undefined) data.issuer = dto.issuer;
    if (dto.issueDate !== undefined) data.issueDate = new Date(dto.issueDate);
    if (dto.expiryDate !== undefined) {
      const exp = new Date(dto.expiryDate);
      data.expiryDate = exp;
      data.status = computeExpiryStatus(exp);
    }
    if (dto.verified !== undefined) data.verified = dto.verified;

    return this.prisma.certification.update({
      where: { id: certId },
      data,
    });
  }

  async deleteCertification(orgId: string, memberId: string, certId: string) {
    await this.ensureCertification(orgId, memberId, certId);
    return this.prisma.certification.delete({ where: { id: certId } });
  }

  private async ensureCertification(
    orgId: string,
    memberId: string,
    certId: string,
  ) {
    const cert = await this.prisma.certification.findFirst({
      where: {
        id: certId,
        memberId,
        member: { organizationId: orgId },
      },
      select: { id: true },
    });
    if (!cert) {
      throw new NotFoundException(`Certification ${certId} not found`);
    }
  }
}
