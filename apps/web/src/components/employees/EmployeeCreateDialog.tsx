"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  CreateEmployeeSchema,
  type CreateEmployeeDto,
} from "@safyr/schemas/employee";
import { ApiError } from "@safyr/api-client";
import { useCreateEmployee, useEmployees } from "@/hooks/employees";
import { useFichesEmploi } from "@/hooks/employees/use-fiche-emploi";
import {
  FICHE_EMPLOI_VIDE,
  ajouterJours,
  ecartJours,
  finEssaiProposee,
  recalculerFiche,
  type FicheEmploi,
} from "@/lib/fiche-emploi";
import {
  FicheEmploiFields,
  type ChangementFiche,
} from "@/components/employees/FicheEmploiFields";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Employee as ApiEmployee } from "@safyr/api-client";
import { Modal } from "@/components/ui/modal";
import { Stepper, Step } from "@/components/ui/stepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { IbanInput } from "@/components/ui/IbanInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Copy,
  Save,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EMPLOYEE_POSTE_OPTIONS,
  QUALIFICATION_OPTIONS,
} from "@/lib/hr-options";
import { fakerFR } from "@faker-js/faker";
import type { AnyFieldApi } from "@tanstack/react-form";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const steps: Step[] = [
  { label: "Informations personnelles", description: "Identité et état civil" },
  { label: "Coordonnées", description: "Contact et adresse" },
  { label: "Emploi", description: "Poste et contrat" },
  { label: "Informations bancaires", description: "RIB et banque" },
];

const STEP_FIELDS: string[][] = [
  [
    "firstName",
    "lastName",
    "dateOfBirth",
    "placeOfBirth",
    "nationality",
    "gender",
    "civilStatus",
    "children",
    "socialSecurityNumber",
    "cartePro",
  ],
  [
    "email",
    "phone",
    "address.street",
    "address.city",
    "address.postalCode",
    "address.country",
  ],
  [
    "employeeNumber",
    "hireDate",
    "position",
    "contractType",
    "workSchedule",
    "status",
  ],
  ["bankDetails.iban", "bankDetails.bic", "bankDetails.bankName"],
];

const emptyDefaults: CreateEmployeeDto = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  placeOfBirth: "",
  nationality: "Française",
  gender: "male",
  civilStatus: "single",
  children: 0,
  socialSecurityNumber: "",
  cartePro: "",
  employeeNumber: "",
  hireDate: "",
  position: "",
  contractType: "CDI",
  workSchedule: "full-time",
  status: "active",
  role: "agent",
  dressingAllowance: false,
  qualifications: [],
  address: {
    street: "",
    city: "",
    postalCode: "",
    country: "France",
  },
  bankDetails: {
    iban: "",
    bic: "",
    bankName: "",
  },
};

function FieldError({ field }: { field: AnyFieldApi }) {
  const isTouched = field.state.meta.isTouched;
  const errors = field.state.meta.errors;
  if (!isTouched || errors.length === 0) return null;
  const msg = errors
    .map((e) => (typeof e === "string" ? e : (e?.message ?? "")))
    .filter(Boolean)
    .join(", ");
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

export function EmployeeCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateEmployee();
  const { ficheDe, enregistrerFiche } = useFichesEmploi();

  // Grille des salaires et période d'essai : hors du modèle Member, tenues
  // à part et enregistrées dans le registre `fiche_emploi` après la création.
  const [fiche, setFiche] = useState<FicheEmploi>(FICHE_EMPLOI_VIDE);
  // Tant que l'essai n'a pas été saisi à la main, il suit la date d'embauche.
  const [essaiManuel, setEssaiManuel] = useState(false);
  // Après « Copier salarié » : décalage (jours) de l'essai par rapport à
  // l'embauche du salarié copié, réappliqué à la date d'embauche du nouveau.
  const [essaiRelatif, setEssaiRelatif] = useState<{
    debut: number;
    fin: number;
  } | null>(null);
  const [copieDe, setCopieDe] = useState<string | null>(null);
  const [copieSansGrille, setCopieSansGrille] = useState(false);

  const form = useForm({
    defaultValues: emptyDefaults,
    validators: { onChange: CreateEmployeeSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const cree = await createMutation.mutateAsync(value);
        const aUneFiche = fiche.categorie || fiche.debutEssai || fiche.finEssai;
        if (aUneFiche) {
          try {
            await enregistrerFiche(
              cree.id,
              `${value.firstName} ${value.lastName}`.trim(),
              recalculerFiche(fiche),
            );
          } catch {
            window.alert(
              "Le salarié est créé, mais la grille des salaires et la période d'essai n'ont pas pu être enregistrées. Renseignez-les depuis son dossier (onglet Informations).",
            );
          }
        }
        onCreated?.();
        resetAndClose();
      } catch (err) {
        if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
          const details = err.details as
            | { path: string; message: string }[]
            | undefined;
          if (Array.isArray(details)) {
            for (const d of details) {
              form.setFieldMeta(d.path as never, (prev) => ({
                ...prev,
                errors: [d.message],
                isTouched: true,
              }));
            }
          }
          setSubmitError(err.message);
        } else if (err instanceof ApiError) {
          setSubmitError(err.message);
        } else {
          setSubmitError("Erreur lors de la création");
        }
      }
    },
  });

  const resetAndClose = () => {
    form.reset();
    setCurrentStep(0);
    setSubmitError(null);
    setFiche(FICHE_EMPLOI_VIDE);
    setEssaiManuel(false);
    setEssaiRelatif(null);
    setCopieDe(null);
    setCopieSansGrille(false);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetAndClose();
    } else {
      onOpenChange(true);
    }
  };

  const isStepValid = () => {
    const fields = STEP_FIELDS[currentStep];
    const fieldMeta = form.state.fieldMeta;
    const values = form.state.values as Record<string, unknown>;
    for (const path of fields) {
      const meta = fieldMeta[path as keyof typeof fieldMeta];
      if (meta && meta.errors.length > 0) return false;
      // also require non-empty for required paths
      if (REQUIRED_PATHS.has(path)) {
        const value = getByPath(values, path);
        if (value === undefined || value === null || value === "") return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    // mark current-step fields touched so inline errors appear
    for (const path of STEP_FIELDS[currentStep]) {
      form.setFieldMeta(path as never, (prev) => ({
        ...prev,
        isTouched: true,
      }));
    }
    await form.validate("change");
    if (!isStepValid()) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      await form.handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const isSubmitting = createMutation.isPending;

  /** Essai proposé à partir de l'embauche et du contrat (sauf saisie manuelle). */
  const essaiPour = (
    base: FicheEmploi,
    hire: string,
    contrat: string | undefined,
    manuel: boolean,
    relatif: { debut: number; fin: number } | null,
  ): FicheEmploi => {
    if (manuel) return base;
    if (relatif && hire) {
      return {
        ...base,
        debutEssai: ajouterJours(hire, relatif.debut),
        finEssai: ajouterJours(hire, relatif.fin),
      };
    }
    return {
      ...base,
      debutEssai: hire,
      finEssai: finEssaiProposee(hire, contrat, base.categorie),
    };
  };

  const changerFiche = (next: FicheEmploi, modifie: ChangementFiche) => {
    if (modifie === "essai") {
      // Deux champs vidés : on reprend le calcul automatique.
      setEssaiManuel(Boolean(next.debutEssai || next.finEssai));
      setEssaiRelatif(null);
      setFiche(next);
      return;
    }
    const v = form.state.values;
    const categorieChangee = next.categorie !== fiche.categorie;
    if (categorieChangee) setEssaiRelatif(null);
    setFiche(
      essaiPour(
        next,
        v.hireDate ?? "",
        v.contractType,
        essaiManuel,
        categorieChangee ? null : essaiRelatif,
      ),
    );
  };

  /** Embauche ou contrat modifiés : l'essai proposé suit. */
  const changerEmbaucheOuContrat = (
    hire: string,
    contrat: string | undefined,
  ) => {
    setEssaiRelatif(null);
    setFiche((f) => essaiPour(f, hire, contrat, essaiManuel, null));
  };

  const copierSalarie = (source: ApiEmployee) => {
    // Seuls les champs de l'étape « Emploi » : ni identité, ni documents.
    const set = (nom: string, valeur: unknown) =>
      form.setFieldValue(nom as never, valeur as never);
    if (source.position) set("position", source.position);
    if (source.contractType) set("contractType", source.contractType);
    if (source.workSchedule) set("workSchedule", source.workSchedule);
    set("dressingAllowance", source.dressingAllowance ?? false);

    const nom = `${source.firstName ?? ""} ${source.lastName ?? ""}`.trim();
    setCopieDe(nom || source.employeeNumber || "ce salarié");

    const sourceFiche = ficheDe(source.id);
    setCopieSansGrille(!sourceFiche);
    if (!sourceFiche) return;

    const hire = form.state.values.hireDate ?? "";
    const debutSource = source.hireDate?.split("T")[0] ?? "";
    const decDebut = ecartJours(debutSource, sourceFiche.debutEssai);
    const decFin = ecartJours(debutSource, sourceFiche.finEssai);
    const relatif =
      decDebut !== null && decFin !== null
        ? { debut: decDebut, fin: decFin }
        : null;
    setEssaiRelatif(relatif);
    setEssaiManuel(false);
    setFiche(
      essaiPour(
        { ...sourceFiche, debutEssai: "", finEssai: "" },
        hire,
        source.contractType ?? undefined,
        false,
        relatif,
      ),
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      type="form"
      title="Nouveau salarié"
      description={`Étape ${currentStep + 1} sur ${steps.length}`}
      size="xl"
      actions={{
        tertiary:
          currentStep > 0
            ? {
                label: "Précédent",
                onClick: handlePrev,
                variant: "outline",
                icon: <ChevronLeft className="h-4 w-4" />,
              }
            : undefined,
        secondary: {
          label: "Annuler",
          onClick: resetAndClose,
          variant: "outline",
        },
        primary: {
          label:
            currentStep === steps.length - 1
              ? isSubmitting
                ? "Création..."
                : "Créer"
              : "Suivant",
          onClick: handleNext,
          disabled: isSubmitting,
          icon:
            currentStep === steps.length - 1 ? (
              <Save className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ),
        },
      }}
    >
      <div className="space-y-6">
        <Stepper steps={steps} currentStep={currentStep} />

        <div className="min-h-100">
          {currentStep === 0 && <PersonalStep form={form} />}
          {currentStep === 1 && <ContactStep form={form} />}
          {currentStep === 2 && (
            <EmploymentStep
              form={form}
              fiche={fiche}
              onFicheChange={changerFiche}
              onEmbaucheOuContrat={changerEmbaucheOuContrat}
              onCopier={copierSalarie}
              copieDe={copieDe}
              copieSansGrille={copieSansGrille}
            />
          )}
          {currentStep === 3 && <BankStep form={form} />}
        </div>

        {submitError && (
          <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md px-3 py-2">
            {submitError}
          </p>
        )}
      </div>
    </Modal>
  );
}

const REQUIRED_PATHS = new Set([
  "firstName",
  "lastName",
  "email",
  "employeeNumber",
  "position",
  "department",
  "address.street",
  "address.city",
  "address.postalCode",
  "bankDetails.iban",
  "bankDetails.bic",
  "bankDetails.bankName",
]);

function pad(n: number, width: number): string {
  return n.toString().padStart(width, "0");
}

function fakeFrenchSsn(birth: Date, sex: "male" | "female"): string {
  const gender = sex === "male" ? "1" : "2";
  const year = pad(birth.getFullYear() % 100, 2);
  const month = pad(birth.getMonth() + 1, 2);
  const dept = pad(fakerFR.number.int({ min: 1, max: 95 }), 2);
  const city = pad(fakerFR.number.int({ min: 1, max: 999 }), 3);
  const order = pad(fakerFR.number.int({ min: 1, max: 999 }), 3);
  const key = pad(fakerFR.number.int({ min: 1, max: 97 }), 2);
  return `${gender}${year}${month}${dept}${city}${order}${key}`;
}

function fakeFrenchIban(): string {
  // FR + 2 check digits + 23 digits → pattern-valid (not checksum-valid)
  const checks = pad(fakerFR.number.int({ min: 10, max: 99 }), 2);
  let rest = "";
  for (let i = 0; i < 23; i++) rest += fakerFR.number.int({ min: 0, max: 9 });
  return `FR${checks}${rest}`;
}

function fakeFrenchPhone(): string {
  const second = fakerFR.helpers.arrayElement([1, 2, 3, 4, 5, 6, 7, 9]);
  let rest = "";
  for (let i = 0; i < 8; i++) rest += fakerFR.number.int({ min: 0, max: 9 });
  return `+33${second}${rest}`;
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

// tanstack-react-form's useForm return type has 10+ generics we don't need at
// the call site — narrow to just `Field` and accept ReactNode to match its
// actual children signature.
type FormApi = {
  Field: (props: {
    name: string;
    children: (field: AnyFieldApi) => React.ReactNode;
  }) => React.ReactNode | Promise<React.ReactNode>;
  setFieldValue: (name: never, value: never) => void;
  state: { values: CreateEmployeeDto };
};

// Multi-sélection des qualifications avec ajout manuel (si absente de la liste).
export function QualificationsPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [custom, setCustom] = useState("");
  const toggle = (q: string) =>
    onChange(
      selected.includes(q) ? selected.filter((x) => x !== q) : [...selected, q],
    );
  const addCustom = () => {
    const v = custom.trim();
    if (v && !selected.includes(v)) onChange([...selected, v]);
    setCustom("");
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-10 w-full justify-between font-normal"
        >
          <span className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">
                Choisir une ou plusieurs…
              </span>
            ) : (
              selected.map((q) => (
                <Badge key={q} variant="secondary">
                  {q}
                </Badge>
              ))
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-1"
      >
        {QUALIFICATION_OPTIONS.map((q) => (
          <label
            key={q}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent"
          >
            <Checkbox
              checked={selected.includes(q)}
              onCheckedChange={() => toggle(q)}
            />
            <span className="text-sm">{q}</span>
          </label>
        ))}
        <div className="my-1 h-px bg-border" />
        <div className="flex items-center gap-1 p-1">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Autre qualification…"
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            onClick={addCustom}
            disabled={!custom.trim()}
          >
            Ajouter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FillFakeButton({ onFill }: { onFill: () => void }) {
  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onFill}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Remplir avec données test
      </Button>
    </div>
  );
}

function PersonalStep({ form }: { form: FormApi }) {
  const fill = () => {
    const sex = fakerFR.helpers.arrayElement(["male", "female"] as const);
    const firstName = fakerFR.person.firstName(sex);
    const lastName = fakerFR.person.lastName();
    const birth = fakerFR.date.birthdate({ min: 20, max: 60, mode: "age" });
    const iso = birth.toISOString().slice(0, 10);
    form.setFieldValue("firstName" as never, firstName as never);
    form.setFieldValue("lastName" as never, lastName as never);
    form.setFieldValue("dateOfBirth" as never, iso as never);
    form.setFieldValue(
      "placeOfBirth" as never,
      fakerFR.location.city() as never,
    );
    form.setFieldValue("nationality" as never, "Française" as never);
    form.setFieldValue("gender" as never, sex as never);
    form.setFieldValue(
      "civilStatus" as never,
      fakerFR.helpers.arrayElement([
        "single",
        "married",
        "civil-union",
      ]) as never,
    );
    form.setFieldValue(
      "children" as never,
      fakerFR.number.int({ min: 0, max: 4 }) as never,
    );
    form.setFieldValue(
      "socialSecurityNumber" as never,
      fakeFrenchSsn(birth, sex) as never,
    );
  };
  return (
    <div className="space-y-4">
      <FillFakeButton onFill={fill} />
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="firstName">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="lastName">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="dateOfBirth">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Date de naissance</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="placeOfBirth">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Lieu de naissance</Label>
              <Input
                id={field.name}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="nationality">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nationalité</Label>
              <Input
                id={field.name}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="gender">
          {(field) => (
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) =>
                  field.handleChange(v as CreateEmployeeDto["gender"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Homme</SelectItem>
                  <SelectItem value="female">Femme</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="civilStatus">
          {(field) => (
            <div className="space-y-2">
              <Label>Situation familiale</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) =>
                  field.handleChange(v as CreateEmployeeDto["civilStatus"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Célibataire</SelectItem>
                  <SelectItem value="married">Marié(e)</SelectItem>
                  <SelectItem value="divorced">Divorcé(e)</SelectItem>
                  <SelectItem value="widowed">Veuf/Veuve</SelectItem>
                  <SelectItem value="civil-union">Union civile</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="children">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nombre d&apos;enfants</Label>
              <Input
                id={field.name}
                type="number"
                min="0"
                value={field.state.value ?? 0}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(parseInt(e.target.value) || 0)
                }
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="cartePro">
          {(field) => (
            <div className="space-y-2 col-span-2">
              <Label htmlFor={field.name}>N° Carte Pro</Label>
              <Input
                id={field.name}
                placeholder="CAR-075-2025-01-01-123456789012"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="socialSecurityNumber">
          {(field) => (
            <div className="space-y-2 col-span-2">
              <Label htmlFor={field.name}>N° Sécurité sociale</Label>
              <Input
                id={field.name}
                placeholder="1 90 05 75 001 234 56"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
      </div>
    </div>
  );
}

function ContactStep({ form }: { form: FormApi }) {
  const fill = () => {
    // email intentionally NOT filled
    form.setFieldValue("phone" as never, fakeFrenchPhone() as never);
    form.setFieldValue(
      "address.street" as never,
      fakerFR.location.streetAddress() as never,
    );
    form.setFieldValue(
      "address.city" as never,
      fakerFR.location.city() as never,
    );
    form.setFieldValue(
      "address.postalCode" as never,
      pad(fakerFR.number.int({ min: 1000, max: 95999 }), 5) as never,
    );
    form.setFieldValue("address.country" as never, "France" as never);
  };
  return (
    <div className="space-y-4">
      <FillFakeButton onFill={fill} />
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="phone">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Téléphone</Label>
              <PhoneInput
                id={field.name}
                value={field.state.value ?? ""}
                onChange={(v) => field.handleChange(v)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
      </div>
      <form.Field name="address.street">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              Rue <span className="text-destructive">*</span>
            </Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError field={field} />
          </div>
        )}
      </form.Field>
      <div className="grid grid-cols-3 gap-4">
        <form.Field name="address.city">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Ville <span className="text-destructive">*</span>
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="address.postalCode">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Code postal <span className="text-destructive">*</span>
              </Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="address.country">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Pays</Label>
              <Input
                id={field.name}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
      </div>
    </div>
  );
}

// « Copier salarié » : liste déroulante (avec recherche) de tous les salariés.
function CopierSalarieButton({
  onCopier,
}: {
  onCopier: (source: ApiEmployee) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: salaries = [], isLoading } = useEmployees();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Copy className="h-4 w-4 text-sky-600" />
          Copier salarié
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Rechercher un salarié…" />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Chargement…" : "Aucun salarié trouvé."}
            </CommandEmpty>
            <CommandGroup>
              {salaries.map((e) => {
                const nom =
                  `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() ||
                  (e.employeeNumber ?? "Salarié");
                return (
                  <CommandItem
                    key={e.id}
                    value={`${nom} ${e.employeeNumber ?? ""} ${e.position ?? ""}`}
                    onSelect={() => {
                      onCopier(e);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{nom}</span>
                      <span className="text-xs text-muted-foreground">
                        {[e.position, e.employeeNumber]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function EmploymentStep({
  form,
  fiche,
  onFicheChange,
  onEmbaucheOuContrat,
  onCopier,
  copieDe,
  copieSansGrille,
}: {
  form: FormApi;
  fiche: FicheEmploi;
  onFicheChange: (next: FicheEmploi, modifie: ChangementFiche) => void;
  onEmbaucheOuContrat: (hire: string, contrat: string | undefined) => void;
  onCopier: (source: ApiEmployee) => void;
  copieDe: string | null;
  copieSansGrille: boolean;
}) {
  const fill = () => {
    const suffix = fakerFR.number.int({ min: 100, max: 9999 });
    const hireDate = fakerFR.date.past({ years: 5 }).toISOString().slice(0, 10);
    const positions = [
      "Agent de sécurité",
      "Agent cynophile",
      "Chef d'équipe",
      "Rondier",
      "Agent SSIAP",
      "Agent de prévention",
    ];
    form.setFieldValue("employeeNumber" as never, `EMP${suffix}` as never);
    const contrat = fakerFR.helpers.arrayElement([
      "CDI",
      "CDD",
      "APPRENTICESHIP",
      "INTERNSHIP",
    ]);
    form.setFieldValue("hireDate" as never, hireDate as never);
    form.setFieldValue(
      "position" as never,
      fakerFR.helpers.arrayElement(positions) as never,
    );
    form.setFieldValue("contractType" as never, contrat as never);
    onEmbaucheOuContrat(hireDate, contrat);
    form.setFieldValue(
      "workSchedule" as never,
      fakerFR.helpers.arrayElement(["full-time", "part-time"]) as never,
    );
    form.setFieldValue("status" as never, "active" as never);
    form.setFieldValue("role" as never, "agent" as never);
    form.setFieldValue(
      "qualifications" as never,
      fakerFR.helpers.arrayElements(QUALIFICATION_OPTIONS, {
        min: 1,
        max: 3,
      }) as never,
    );
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CopierSalarieButton onCopier={onCopier} />
        <FillFakeButton onFill={fill} />
      </div>
      {copieDe && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Informations d&apos;emploi copiées depuis <strong>{copieDe}</strong>{" "}
            (poste, contrat, temps de travail, grille des salaires, essai). Vous
            pouvez les modifier ci-dessous.
            {copieSansGrille &&
              " Ce salarié n'a pas de grille des salaires enregistrée : seuls les champs du formulaire ont été copiés."}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="employeeNumber">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                Numéro d&apos;employé{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id={field.name}
                placeholder="EMP013"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="hireDate">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Date d&apos;embauche</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  onEmbaucheOuContrat(
                    e.target.value,
                    form.state.values.contractType,
                  );
                }}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="position">
          {(field) => (
            <div className="space-y-2">
              <Label>
                Poste <span className="text-destructive">*</span>
              </Label>
              <Select
                value={field.state.value || undefined}
                onValueChange={(v) => field.handleChange(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un poste…" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_POSTE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="qualifications">
          {(field) => (
            <div className="space-y-2">
              <Label>Qualifications</Label>
              <QualificationsPicker
                selected={field.state.value ?? []}
                onChange={(next) => field.handleChange(next as never)}
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="contractType">
          {(field) => (
            <div className="space-y-2">
              <Label>Type de contrat</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => {
                  field.handleChange(v as CreateEmployeeDto["contractType"]);
                  onEmbaucheOuContrat(form.state.values.hireDate ?? "", v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="APPRENTICESHIP">Apprentissage</SelectItem>
                  <SelectItem value="INTERNSHIP">Stage</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="workSchedule">
          {(field) => (
            <div className="space-y-2">
              <Label>Temps de travail</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) =>
                  field.handleChange(v as CreateEmployeeDto["workSchedule"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Temps complet</SelectItem>
                  <SelectItem value="part-time">Temps partiel</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="status">
          {(field) => (
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) =>
                  field.handleChange(v as CreateEmployeeDto["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="terminated">Terminé</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field={field} />
            </div>
          )}
        </form.Field>
        <form.Field name="dressingAllowance">
          {(field) => (
            <div className="flex items-start gap-2 pt-2 sm:col-span-2">
              <Checkbox
                id="dressingAllowance"
                checked={!!field.state.value}
                onCheckedChange={(v) => field.handleChange(v === true)}
              />
              <Label
                htmlFor="dressingAllowance"
                className="cursor-pointer text-sm font-normal leading-snug"
              >
                Soumis à l&apos;indemnité d&apos;habillage
                <span className="block text-xs text-muted-foreground">
                  Calculée automatiquement en paie selon le nombre
                  d&apos;heures.
                </span>
              </Label>
            </div>
          )}
        </form.Field>
      </div>

      <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
        <div>
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Grille des salaires et période d&apos;essai
          </h3>
          <p className="text-xs text-muted-foreground">
            Le coefficient, le taux horaire et le salaire se remplissent selon
            la grille. La fin d&apos;essai est proposée d&apos;après le contrat
            et reste modifiable.
          </p>
        </div>
        <FicheEmploiFields fiche={fiche} onChange={onFicheChange} />
      </div>
    </div>
  );
}

function BankStep({ form }: { form: FormApi }) {
  const fill = () => {
    const banks = [
      "BNP Paribas",
      "Société Générale",
      "Crédit Agricole",
      "LCL",
      "Crédit Mutuel",
      "Banque Populaire",
      "La Banque Postale",
      "Caisse d'Épargne",
    ];
    form.setFieldValue("bankDetails.iban" as never, fakeFrenchIban() as never);
    form.setFieldValue(
      "bankDetails.bic" as never,
      fakerFR.finance.bic() as never,
    );
    form.setFieldValue(
      "bankDetails.bankName" as never,
      fakerFR.helpers.arrayElement(banks) as never,
    );
  };
  return (
    <div className="space-y-4">
      <FillFakeButton onFill={fill} />
      <form.Field name="bankDetails.iban">
        {(ibanField) => (
          <form.Field name="bankDetails.bic">
            {(bicField) => (
              <form.Field name="bankDetails.bankName">
                {(bankField) => (
                  <div className="space-y-2">
                    <IbanInput
                      ibanValue={ibanField.state.value}
                      bicValue={bicField.state.value}
                      bankNameValue={bankField.state.value}
                      onIbanChange={(v) => ibanField.handleChange(v)}
                      onBicChange={(v) => bicField.handleChange(v)}
                      onBankNameChange={(v) => bankField.handleChange(v)}
                      required
                    />
                    <FieldError field={ibanField} />
                    <FieldError field={bicField} />
                    <FieldError field={bankField} />
                  </div>
                )}
              </form.Field>
            )}
          </form.Field>
        )}
      </form.Field>
    </div>
  );
}
