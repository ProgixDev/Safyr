"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  CreateCertificationSchema,
  type CreateCertificationDto,
} from "@safyr/schemas/employee";
import {
  ApiError,
  type Certification,
  type CreateCertificationPayload,
  type UpdateCertificationPayload,
} from "@safyr/api-client";
import {
  useCreateCertification,
  useUpdateCertification,
} from "@/hooks/employees";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnyFieldApi } from "@tanstack/react-form";
import { formatDateForInput } from "@/lib/date-utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  existing?: Certification | null;
}

const CERTIFICATION_OPTIONS: { value: Certification["type"]; label: string }[] =
  [
    { value: "CQP_APS", label: "CQP / APS" },
    { value: "CNAPS", label: "Carte Professionnelle CNAPS" },
    { value: "SSIAP1", label: "SSIAP 1" },
    { value: "SSIAP2", label: "SSIAP 2" },
    { value: "SSIAP3", label: "SSIAP 3" },
    { value: "SST", label: "SST" },
    { value: "VM", label: "Visite Médicale" },
    { value: "H0B0", label: "H0B0" },
    { value: "FIRE", label: "Habilitation Incendie" },
  ];

function emptyDefaults(): CreateCertificationDto {
  return {
    type: "CNAPS",
    number: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    verified: false,
  };
}

function toDto(c: Certification): CreateCertificationDto {
  return {
    type: c.type,
    number: c.number,
    issuer: c.issuer,
    issueDate: formatDateForInput(c.issueDate),
    expiryDate: formatDateForInput(c.expiryDate),
    verified: c.verified,
  };
}

export function CertificationFormDialog({
  open,
  onOpenChange,
  memberId,
  existing,
}: Props) {
  const isEdit = !!existing;
  const createMutation = useCreateCertification(memberId);
  const updateMutation = useUpdateCertification(memberId);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const defaultValues = useMemo<CreateCertificationDto>(
    () => (existing ? toDto(existing) : emptyDefaults()),
    [existing],
  );

  const form = useForm({
    defaultValues,
    validators: { onChange: CreateCertificationSchema },
    onSubmit: async ({ value }) => {
      setGlobalError(null);
      try {
        if (isEdit && existing) {
          await updateMutation.mutateAsync({
            certId: existing.id,
            data: value as UpdateCertificationPayload,
          });
        } else {
          await createMutation.mutateAsync(value as CreateCertificationPayload);
        }
        onOpenChange(false);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Échec de l'enregistrement";
        setGlobalError(message);
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setGlobalError(null);
    }
  }, [open, defaultValues, form]);

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      type="form"
      size="md"
      title={isEdit ? "Modifier la certification" : "Nouvelle certification"}
      description="CNAPS, SSIAP, SST, CQP/APS, VM, H0B0, Incendie"
      actions={{
        secondary: {
          label: "Annuler",
          onClick: () => onOpenChange(false),
          variant: "outline",
        },
        primary: {
          label: pending
            ? "Enregistrement..."
            : isEdit
              ? "Mettre à jour"
              : "Créer",
          onClick: () => form.handleSubmit(),
          disabled: pending,
        },
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="type">
          {(field: AnyFieldApi) => (
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={field.state.value as string}
                onValueChange={(v) => field.handleChange(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="number">
          {(field: AnyFieldApi) => (
            <div className="space-y-2">
              <Label>Numéro *</Label>
              <Input
                value={(field.state.value as string) ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="CNAPS-2024-..."
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="issuer">
          {(field: AnyFieldApi) => (
            <div className="space-y-2">
              <Label>Organisme émetteur *</Label>
              <Input
                value={(field.state.value as string) ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="CNAPS, INRS, Centre de formation..."
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-2 gap-3">
          <form.Field name="issueDate">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Date d&apos;émission *</Label>
                <Input
                  type="date"
                  value={(field.state.value as string) ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="expiryDate">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Date d&apos;expiration *</Label>
                <Input
                  type="date"
                  value={(field.state.value as string) ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError field={field} />
              </div>
            )}
          </form.Field>
        </div>

        {globalError && (
          <p className="text-sm text-destructive" role="alert">
            {globalError}
          </p>
        )}
      </form>
    </Modal>
  );
}

function FieldError({ field }: { field: AnyFieldApi }) {
  const errors = field.state.meta.errors;
  if (!errors || errors.length === 0) return null;
  const first = errors[0];
  const text =
    typeof first === "string"
      ? first
      : ((first as { message?: string })?.message ?? "Valeur invalide");
  return <p className="text-xs text-destructive">{text}</p>;
}
