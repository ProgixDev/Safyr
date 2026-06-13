"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { CreateSiteSchema, type CreateSiteDto } from "@safyr/schemas/site";
import {
  ApiError,
  type Site,
  type UpdateSitePayload,
} from "@safyr/api-client";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSite, useUpdateSite } from "@/hooks/sites";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  existing?: Site | null;
}

const empty: CreateSiteDto = {
  name: "",
  clientName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "France",
  latitude: undefined,
  longitude: undefined,
  geofenceRadiusMeters: undefined,
  notes: "",
  active: true,
};

function toDto(s: Site): CreateSiteDto {
  return {
    name: s.name,
    clientName: s.clientName ?? "",
    address: s.address ?? "",
    city: s.city ?? "",
    postalCode: s.postalCode ?? "",
    country: s.country ?? "France",
    latitude: s.latitude ?? undefined,
    longitude: s.longitude ?? undefined,
    geofenceRadiusMeters: s.geofenceRadiusMeters ?? undefined,
    notes: s.notes ?? "",
    active: s.active,
  };
}

export function SiteCreateDialog({
  open,
  onOpenChange,
  onCreated,
  existing,
}: Props) {
  const isEdit = !!existing;
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite(existing?.id ?? "");
  const mutation = isEdit ? updateMutation : createMutation;
  const [globalError, setGlobalError] = useState<string | null>(null);

  const defaultValues = useMemo<CreateSiteDto>(
    () => (existing ? toDto(existing) : empty),
    [existing],
  );

  const form = useForm({
    defaultValues,
    validators: { onChange: CreateSiteSchema },
    onSubmit: async ({ value }) => {
      setGlobalError(null);
      try {
        const payload = {
          ...value,
          clientName: value.clientName?.trim() || undefined,
          address: value.address?.trim() || undefined,
          city: value.city?.trim() || undefined,
          postalCode: value.postalCode?.trim() || undefined,
          notes: value.notes?.trim() || undefined,
        };
        if (isEdit && existing) {
          await updateMutation.mutateAsync(payload as UpdateSitePayload);
        } else {
          await createMutation.mutateAsync(payload);
        }
        onCreated?.();
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

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      type="form"
      size="lg"
      title={isEdit ? "Modifier le site" : "Nouveau site"}
      description="Référentiel des sites clients (lieu d'intervention)"
      actions={{
        secondary: {
          label: "Annuler",
          onClick: () => onOpenChange(false),
          variant: "outline",
        },
        primary: {
          label: mutation.isPending
            ? "Enregistrement..."
            : isEdit
              ? "Mettre à jour"
              : "Créer le site",
          onClick: () => form.handleSubmit(),
          disabled: mutation.isPending,
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
        <div className="grid grid-cols-2 gap-3">
          <form.Field name="name">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Nom du site *</Label>
                <Input
                  value={(field.state.value as string) ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Siège Tour Eiffel"
                />
                <FieldError field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="clientName">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Client</Label>
                <Input
                  value={(field.state.value as string) ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Société cliente"
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="address">
          {(field: AnyFieldApi) => (
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={(field.state.value as string) ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="5 avenue Anatole France"
              />
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-3 gap-3">
          <form.Field name="postalCode">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={(field.state.value as string) ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="75007"
                  maxLength={5}
                />
                <FieldError field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="city">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={(field.state.value as string) ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Paris"
                />
              </div>
            )}
          </form.Field>
          <form.Field name="country">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input
                  value={(field.state.value as string) ?? "France"}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <form.Field name="latitude">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={
                    field.state.value == null
                      ? ""
                      : (field.state.value as number)
                  }
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                  placeholder="48.8584"
                />
              </div>
            )}
          </form.Field>
          <form.Field name="longitude">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={
                    field.state.value == null
                      ? ""
                      : (field.state.value as number)
                  }
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                  placeholder="2.2945"
                />
              </div>
            )}
          </form.Field>
          <form.Field name="geofenceRadiusMeters">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Rayon géo (m)</Label>
                <Input
                  type="number"
                  min={10}
                  max={10000}
                  value={
                    field.state.value == null
                      ? ""
                      : (field.state.value as number)
                  }
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                  placeholder="100"
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="notes">
          {(field: AnyFieldApi) => (
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={(field.state.value as string) ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Consignes spécifiques, accès, codes, etc."
                rows={3}
              />
            </div>
          )}
        </form.Field>

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
