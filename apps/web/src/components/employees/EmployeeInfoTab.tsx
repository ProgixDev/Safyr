"use client";

import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneField } from "@/components/ui/phone-field";
import { FormFieldRow } from "@/components/ui/form-field-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IbanInput } from "@/components/ui/IbanInput";
import { Edit, Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/lib/types";
import { useUpdateEmployee } from "@/hooks/employees";
import { ApiError, type UpdateEmployeePayload } from "@safyr/api-client";

interface Props {
  employee: Employee;
}

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  gender: "male" | "female" | "other";
  civilStatus: "single" | "married" | "divorced" | "widowed" | "civil-union";
  children: number;
  socialSecurityNumber: string;
  position: string;
  employeeNumber: string;
  hireDate: string;
  contractType?: "CDI" | "CDD" | "INTERIM" | "APPRENTICESHIP" | "INTERNSHIP";
  workSchedule: "full-time" | "part-time";
  status: "active" | "inactive" | "suspended" | "terminated";
  role: "owner" | "agent";
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  bankDetails: {
    iban: string;
    bic: string;
    bankName: string;
  };
};

const toIso = (d: Date | undefined): string => {
  if (!d) return "";
  const t = d.getTime();
  if (!t || Number.isNaN(t)) return "";
  return d.toISOString().split("T")[0];
};

// Champ select gris en lecture, éditable en mode édition.
function SelectRow({
  field,
  label,
  editing,
  options,
}: {
  field: AnyFieldApi;
  label: string;
  editing: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-base font-medium">{label}</Label>
      <Select
        value={(field.state.value as string) || undefined}
        onValueChange={(v) => field.handleChange(v as never)}
        disabled={!editing}
      >
        <SelectTrigger
          className={cn(
            "text-base",
            !editing && "bg-muted/30 border-transparent shadow-none",
          )}
        >
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function EmployeeInfoTab({ employee }: Props) {
  const updateMutation = useUpdateEmployee(employee.id);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<FormValues>(
    () => ({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: toIso(employee.dateOfBirth),
      placeOfBirth: employee.placeOfBirth,
      nationality: employee.nationality,
      gender: employee.gender,
      civilStatus: employee.civilStatus,
      children: employee.children ?? 0,
      socialSecurityNumber: employee.socialSecurityNumber,
      position: employee.position,
      employeeNumber: employee.employeeNumber,
      hireDate: toIso(employee.hireDate),
      contractType: employee.contractType,
      workSchedule: employee.workSchedule,
      status: employee.status,
      role: employee.role ?? "agent",
      address: { ...employee.address },
      bankDetails: { ...employee.bankDetails },
    }),
    [employee],
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setFormError(null);
      const payload: UpdateEmployeePayload = {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phone: value.phone,
        dateOfBirth: value.dateOfBirth || undefined,
        placeOfBirth: value.placeOfBirth,
        nationality: value.nationality,
        gender: value.gender,
        civilStatus: value.civilStatus,
        children: value.children,
        socialSecurityNumber: value.socialSecurityNumber,
        position: value.position,
        employeeNumber: value.employeeNumber,
        hireDate: value.hireDate || undefined,
        contractType: value.contractType,
        workSchedule: value.workSchedule,
        status: value.status,
        role: value.role,
        address: value.address,
        bankDetails: value.bankDetails,
      };
      try {
        await updateMutation.mutateAsync(payload);
        setIsEditing(false);
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
          setFormError("Veuillez corriger les champs en rouge.");
        } else {
          setFormError("Une erreur est survenue lors de l'enregistrement.");
        }
      }
    },
  });

  const handleCancel = () => {
    form.reset();
    setFormError(null);
    setIsEditing(false);
  };

  const EditButtons = (
    <div className="flex items-center justify-end gap-2">
      {!isEditing ? (
        <Button type="button" size="sm" onClick={() => setIsEditing(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={updateMutation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => form.handleSubmit()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {EditButtons}
      {formError && (
        <p className="text-right text-sm text-destructive">{formError}</p>
      )}

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <form.Field name="firstName">
              {(field) => (
                <FormFieldRow field={field} label="Prénom" editing={isEditing}>
                  <Input />
                </FormFieldRow>
              )}
            </form.Field>
            <form.Field name="lastName">
              {(field) => (
                <FormFieldRow field={field} label="Nom" editing={isEditing}>
                  <Input />
                </FormFieldRow>
              )}
            </form.Field>
            <form.Field name="dateOfBirth">
              {(field) => (
                <FormFieldRow
                  field={field}
                  label="Date de naissance"
                  editing={isEditing}
                >
                  <Input type="date" />
                </FormFieldRow>
              )}
            </form.Field>
            <form.Field name="placeOfBirth">
              {(field) => (
                <FormFieldRow
                  field={field}
                  label="Lieu de naissance"
                  editing={isEditing}
                >
                  <Input />
                </FormFieldRow>
              )}
            </form.Field>
            <form.Field name="nationality">
              {(field) => (
                <FormFieldRow
                  field={field}
                  label="Nationalité"
                  editing={isEditing}
                >
                  <Input />
                </FormFieldRow>
              )}
            </form.Field>
            <form.Field name="socialSecurityNumber">
              {(field) => (
                <FormFieldRow
                  field={field}
                  label="N° Sécurité sociale"
                  editing={isEditing}
                >
                  <Input />
                </FormFieldRow>
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Informations d'emploi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Informations d&apos;emploi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <form.Field name="employeeNumber">
              {(field) => (
                <FormFieldRow
                  field={field}
                  label="N° Employé"
                  editing={isEditing}
                >
                  <Input />
                </FormFieldRow>
              )}
            </form.Field>
            <form.Field name="hireDate">
              {(field) => (
                <FormFieldRow
                  field={field}
                  label="Date d'embauche"
                  editing={isEditing}
                >
                  <Input type="date" />
                </FormFieldRow>
              )}
            </form.Field>
            <form.Field name="position">
              {(field) => (
                <FormFieldRow field={field} label="Poste" editing={isEditing}>
                  <Input />
                </FormFieldRow>
              )}
            </form.Field>
            <form.Field name="role">
              {(field) => (
                <SelectRow
                  field={field}
                  label="Rôle"
                  editing={isEditing}
                  options={[
                    { value: "agent", label: "Agent" },
                    { value: "owner", label: "Propriétaire" },
                  ]}
                />
              )}
            </form.Field>
            <form.Field name="contractType">
              {(field) => (
                <SelectRow
                  field={field}
                  label="Type de contrat"
                  editing={isEditing}
                  options={[
                    { value: "CDI", label: "CDI" },
                    { value: "CDD", label: "CDD" },
                    { value: "APPRENTICESHIP", label: "Apprentissage" },
                    { value: "INTERNSHIP", label: "Stage" },
                  ]}
                />
              )}
            </form.Field>
            <form.Field name="workSchedule">
              {(field) => (
                <SelectRow
                  field={field}
                  label="Temps de travail"
                  editing={isEditing}
                  options={[
                    { value: "full-time", label: "Temps complet" },
                    { value: "part-time", label: "Temps partiel" },
                  ]}
                />
              )}
            </form.Field>
            <form.Field name="status">
              {(field) => (
                <SelectRow
                  field={field}
                  label="Statut"
                  editing={isEditing}
                  options={[
                    { value: "active", label: "Actif" },
                    { value: "inactive", label: "Inactif" },
                    { value: "suspended", label: "Suspendu" },
                    { value: "terminated", label: "Terminé" },
                  ]}
                />
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Coordonnées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <form.Field name="email">
              {(field) => (
                <FormFieldRow field={field} label="Email" editing={isEditing}>
                  <Input type="email" />
                </FormFieldRow>
              )}
            </form.Field>
            <form.Field name="phone">
              {(field) => (
                <FormFieldRow
                  field={field}
                  label="Téléphone"
                  editing={isEditing}
                >
                  <PhoneField />
                </FormFieldRow>
              )}
            </form.Field>
          </div>
        </CardContent>
      </Card>

      {/* Adresse + Banque */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Adresse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field name="address.street">
              {(field) => (
                <FormFieldRow field={field} label="Rue" editing={isEditing}>
                  <Input />
                </FormFieldRow>
              )}
            </form.Field>
            <div className="grid gap-4 md:grid-cols-3">
              <form.Field name="address.city">
                {(field) => (
                  <FormFieldRow field={field} label="Ville" editing={isEditing}>
                    <Input />
                  </FormFieldRow>
                )}
              </form.Field>
              <form.Field name="address.postalCode">
                {(field) => (
                  <FormFieldRow
                    field={field}
                    label="Code postal"
                    editing={isEditing}
                  >
                    <Input />
                  </FormFieldRow>
                )}
              </form.Field>
              <form.Field name="address.country">
                {(field) => (
                  <FormFieldRow field={field} label="Pays" editing={isEditing}>
                    <Input />
                  </FormFieldRow>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Coordonnées bancaires</CardTitle>
          </CardHeader>
          <CardContent>
            <form.Field name="bankDetails.iban">
              {(ibanField) => (
                <form.Field name="bankDetails.bic">
                  {(bicField) => (
                    <form.Field name="bankDetails.bankName">
                      {(bankField) => (
                        <IbanInput
                          ibanValue={(ibanField.state.value as string) ?? ""}
                          bicValue={(bicField.state.value as string) ?? ""}
                          bankNameValue={
                            (bankField.state.value as string) ?? ""
                          }
                          onIbanChange={(v) =>
                            ibanField.handleChange(v as never)
                          }
                          onBicChange={(v) => bicField.handleChange(v as never)}
                          onBankNameChange={(v) =>
                            bankField.handleChange(v as never)
                          }
                          disabled={!isEditing}
                        />
                      )}
                    </form.Field>
                  )}
                </form.Field>
              )}
            </form.Field>
          </CardContent>
        </Card>
      </div>

      {isEditing && (
        <div className="border-t pt-4">{EditButtons}</div>
      )}
    </div>
  );
}
