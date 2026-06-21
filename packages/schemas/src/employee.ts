import { z } from "zod";

export const stripSpaces = (v: string) => v.replace(/\s+/g, "");
export const upperTrim = (v: string) => v.trim().toUpperCase();
export const plainTrim = (v: string) => v.trim();

export const optionalPattern = (
  pattern: RegExp,
  message: string,
  normalize?: (v: string) => string,
) =>
  z
    .string()
    .refine(
      (v) => v === "" || pattern.test(normalize ? normalize(v) : v),
      message,
    )
    .optional();

export const optionalText = (
  max: number,
  message = `${max} caractères maximum`,
) => z.string().trim().max(max, message).optional();

export const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const NAME_REGEX = /^[\p{L}][\p{L}\s'’-]*$/u;
export const NAME_MSG =
  "Caractères autorisés: lettres, espaces, tirets, apostrophes";

export const NameSchema = z
  .string()
  .trim()
  .min(1, "Champ requis")
  .max(100, "100 caractères maximum")
  .regex(NAME_REGEX, NAME_MSG);

export const OptionalNameSchema = z
  .string()
  .refine(
    (v) => v === "" || (v.trim().length <= 100 && NAME_REGEX.test(v.trim())),
    "Nom invalide",
  )
  .optional();

export const EmailSchema = z
  .string()
  .refine(
    (v) =>
      v === "" || (v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
    "Email invalide",
  )
  .optional();

export const PhoneFrSchema = optionalPattern(
  /^(?:(?:\+|00)33|0)[1-9]\d{8}$/,
  "Numéro de téléphone invalide (format français)",
  stripSpaces,
);

export const SsnFrSchema = optionalPattern(
  /^[12]\d{2}(?:0[1-9]|1[0-2])(?:2[AB]|\d{2})\d{3}\d{3}\d{2}$/,
  "Numéro de sécurité sociale invalide",
  stripSpaces,
);

export const BirthDateSchema = z
  .string()
  .refine((v) => v === "" || isIsoDate(v), "Date invalide")
  .refine(
    (v) => v === "" || new Date(v) < startOfToday(),
    "La date de naissance doit être dans le passé",
  )
  .optional();

export const PastOrTodayDate = z
  .string()
  .refine((v) => v === "" || isIsoDate(v), "Date invalide")
  .refine(
    (v) => v === "" || new Date(v) <= startOfToday(),
    "La date ne peut pas être dans le futur",
  )
  .optional();

export const AnyIsoDate = z
  .string()
  .refine((v) => v === "" || isIsoDate(v), "Date invalide")
  .optional();


const EmailRequiredSchema = z
  .string()
  .trim()
  .min(1, "Email requis")
  .max(254, "Email trop long")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email invalide");

const IbanSchema = optionalPattern(
  /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/,
  "IBAN invalide",
  (v) => stripSpaces(upperTrim(v)),
);

const BicSchema = optionalPattern(
  /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  "BIC invalide",
  upperTrim,
);

export const MemberStatusSchema = z.enum([
  "active",
  "inactive",
  "suspended",
  "terminated",
]);

export const MemberRoleSchema = z.enum(["owner", "agent"]);

export const GenderSchema = z.enum(["male", "female", "other"]);

export const CivilStatusSchema = z.enum([
  "single",
  "married",
  "divorced",
  "widowed",
  "civil-union",
]);

export const ContractTypeSchema = z.enum([
  "CDI",
  "CDD",
  "INTERIM",
  "APPRENTICESHIP",
  "INTERNSHIP",
]);

export const WorkScheduleSchema = z.enum(["full-time", "part-time"]);

export const CertificationTypeSchema = z.enum([
  "CQP_APS",
  "CNAPS",
  "SSIAP1",
  "SSIAP2",
  "SSIAP3",
  "SST",
  "VM",
  "H0B0",
  "FIRE",
]);

export const AddressSchema = z.object({
  street: z.string().trim().min(1, "Rue requise").max(200),
  city: z.string().trim().min(1, "Ville requise").max(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
  country: z.string().trim().max(80).optional(),
});

export const AddressPartialSchema = AddressSchema.partial();

export const BankDetailsSchema = z.object({
  iban: z
    .string()
    .trim()
    .min(1, "IBAN requis")
    .transform((v) => stripSpaces(upperTrim(v)))
    .pipe(z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/, "IBAN invalide")),
  bic: z
    .string()
    .trim()
    .min(1, "BIC requis")
    .transform(upperTrim)
    .pipe(
      z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "BIC invalide"),
    ),
  bankName: z.string().trim().min(1, "Nom de banque requis").max(120),
});

export const BankDetailsPartialSchema = z.object({
  iban: IbanSchema,
  bic: BicSchema,
  bankName: optionalText(120),
});

// Qualifications cumulables d'un agent de sécurité (cases à cocher multiples).
export const QualificationSchema = z.enum([
  "SSIAP1",
  "SSIAP2",
  "SSIAP3",
  "SST",
  "H0B0",
  "CARTE PRO",
  "CQP/APS",
  "AUTRES",
]);
export type Qualification = z.infer<typeof QualificationSchema>;

export const CreateEmployeeSchema = z.object({
  firstName: NameSchema,
  lastName: NameSchema,
  email: EmailRequiredSchema,
  phone: PhoneFrSchema,
  dateOfBirth: BirthDateSchema,
  placeOfBirth: optionalText(120),
  nationality: optionalText(60),
  gender: GenderSchema.optional(),
  civilStatus: CivilStatusSchema.optional(),
  children: z.number().int().min(0).max(30).optional(),
  socialSecurityNumber: SsnFrSchema,
  employeeNumber: z.string().trim().min(1, "Numéro d'employé requis").max(40),
  hireDate: PastOrTodayDate,
  position: z.string().trim().min(1, "Poste requis").max(120),
  contractType: ContractTypeSchema.optional(),
  workSchedule: WorkScheduleSchema.optional(),
  status: MemberStatusSchema.optional(),
  role: MemberRoleSchema.optional(),
  qualifications: z.array(z.string().trim().min(1).max(60)).optional(),
  address: AddressSchema,
  bankDetails: BankDetailsSchema,
});

export const UpdateEmployeeSchema = z.object({
  firstName: OptionalNameSchema,
  lastName: OptionalNameSchema,
  email: EmailSchema,
  phone: PhoneFrSchema,
  dateOfBirth: BirthDateSchema,
  placeOfBirth: optionalText(120),
  nationality: optionalText(60),
  gender: GenderSchema.optional(),
  civilStatus: CivilStatusSchema.optional(),
  children: z.number().int().min(0).max(30).optional(),
  socialSecurityNumber: SsnFrSchema,
  employeeNumber: optionalText(40),
  hireDate: PastOrTodayDate,
  position: optionalText(120),
  department: optionalText(120),
  contractType: ContractTypeSchema.optional(),
  workSchedule: WorkScheduleSchema.optional(),
  status: MemberStatusSchema.optional(),
  role: MemberRoleSchema.optional(),
  qualifications: z.array(z.string().trim().min(1).max(60)).optional(),
  address: AddressPartialSchema.optional(),
  bankDetails: BankDetailsPartialSchema.optional(),
});

export const UploadMemberDocumentSchema = z.object({
  requirementId: z.string().min(1, "requirementId requis"),
  expiryDate: AnyIsoDate,
});

export const CreateCertificationSchema = z.object({
  type: CertificationTypeSchema,
  number: z.string().trim().min(1, "Numéro requis").max(60),
  issuer: z.string().trim().min(1, "Organisme requis").max(120),
  issueDate: z.string().refine(isIsoDate, "Date invalide"),
  expiryDate: z.string().refine(isIsoDate, "Date invalide"),
  verified: z.boolean().optional(),
});

export const UpdateCertificationSchema = CreateCertificationSchema.partial();

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeSchema>;
export type UploadMemberDocumentDto = z.infer<
  typeof UploadMemberDocumentSchema
>;
export type CreateCertificationDto = z.infer<typeof CreateCertificationSchema>;
export type UpdateCertificationDto = z.infer<typeof UpdateCertificationSchema>;
export type MemberStatus = z.infer<typeof MemberStatusSchema>;
export type MemberRole = z.infer<typeof MemberRoleSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type CivilStatus = z.infer<typeof CivilStatusSchema>;
export type ContractType = z.infer<typeof ContractTypeSchema>;
export type WorkSchedule = z.infer<typeof WorkScheduleSchema>;
export type CertificationType = z.infer<typeof CertificationTypeSchema>;
