import { z } from "zod";

 const stripSpaces = (v: string) => v.replace(/\s+/g, "");
 const upperTrim = (v: string) => v.trim().toUpperCase();
 const plainTrim = (v: string) => v.trim();

 const optionalPattern = (
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

 const optionalText = (
  max: number,
  message = `${max} caractères maximum`,
) => z.string().trim().max(max, message).optional();

 const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

 const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

 const NAME_REGEX = /^[\p{L}][\p{L}\s'’-]*$/u;
 const NAME_MSG =
  "Caractères autorisés: lettres, espaces, tirets, apostrophes";

 const NameSchema = z
  .string()
  .trim()
  .min(1, "Champ requis")
  .max(100, "100 caractères maximum")
  .regex(NAME_REGEX, NAME_MSG);

 const OptionalNameSchema = z
  .string()
  .refine(
    (v) => v === "" || (v.trim().length <= 100 && NAME_REGEX.test(v.trim())),
    "Nom invalide",
  )
  .optional();

 const EmailSchema = z
  .string()
  .refine(
    (v) =>
      v === "" || (v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
    "Email invalide",
  )
  .optional();

 const PhoneFrSchema = optionalPattern(
  /^(?:(?:\+|00)33|0)[1-9]\d{8}$/,
  "Numéro de téléphone invalide (format français)",
  stripSpaces,
);

 const SsnFrSchema = optionalPattern(
  /^[12]\d{2}(?:0[1-9]|1[0-2])(?:2[AB]|\d{2})\d{3}\d{3}\d{2}$/,
  "Numéro de sécurité sociale invalide",
  stripSpaces,
);

 const BirthDateSchema = z
  .string()
  .refine((v) => v === "" || isIsoDate(v), "Date invalide")
  .refine(
    (v) => v === "" || new Date(v) < startOfToday(),
    "La date de naissance doit être dans le passé",
  )
  .optional();

 const PastOrTodayDate = z
  .string()
  .refine((v) => v === "" || isIsoDate(v), "Date invalide")
  .refine(
    (v) => v === "" || new Date(v) <= startOfToday(),
    "La date ne peut pas être dans le futur",
  )
  .optional();

 const AnyIsoDate = z
  .string()
  .refine((v) => v === "" || isIsoDate(v), "Date invalide")
  .optional();


const SiretSchema = optionalPattern(
  /^\d{14}$/,
  "SIRET invalide (14 chiffres attendus)",
  stripSpaces,
);

const ApeSchema = optionalPattern(
  /^\d{4}[A-Z]$/,
  "Code APE invalide (ex. 8010Z)",
  upperTrim,
);

const ShareCapitalSchema = optionalPattern(
  /^\d+(?:[.,]\d{1,2})?$/,
  "Capital social invalide (montant positif, 2 décimales max)",
);

export const AuthorizationNumberSchema = optionalPattern(
  /^[A-Z0-9-]{6,60}$/i,
  "Numéro d'autorisation CNAPS invalide",
  plainTrim,
);

export const UpdateRepresentativeSchema = z.object({
  firstName: OptionalNameSchema,
  lastName: OptionalNameSchema,
  birthDate: BirthDateSchema,
  birthPlace: optionalText(120),
  nationality: optionalText(60),
  address: optionalText(300),
  email: EmailSchema,
  phone: PhoneFrSchema,
  position: optionalText(120),
  appointmentDate: PastOrTodayDate,
  socialSecurityNumber: SsnFrSchema,
});

export const UpdateOrganizationSchema = z.object({
  name: optionalText(150),
  logo: z.string().trim().max(500).optional(),
  shareCapital: ShareCapitalSchema,
  authorizationNumber: AuthorizationNumberSchema,
  email: EmailSchema,
  phone: PhoneFrSchema,
  siret: SiretSchema,
  ape: ApeSchema,
  address: optionalText(300),
  representative: UpdateRepresentativeSchema.optional(),
});

export const CreateRepresentativeSchema = UpdateRepresentativeSchema.extend({
  firstName: NameSchema,
  lastName: NameSchema,
});

export const UploadDocumentSchema = z.object({
  requirementId: z.string().min(1, "requirementId requis"),
  expiryDate: z
    .string()
    .refine((v) => v === "" || isIsoDate(v), "Date invalide")
    .optional(),
});

export type UploadDocumentDto = z.infer<typeof UploadDocumentSchema>;
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;
export type UpdateRepresentativeDto = z.infer<
  typeof UpdateRepresentativeSchema
>;
export type CreateRepresentativeDto = z.infer<
  typeof CreateRepresentativeSchema
>;
