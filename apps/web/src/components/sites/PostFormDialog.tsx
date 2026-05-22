"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { CreatePostSchema, type CreatePostDto } from "@safyr/schemas/site";
import {
  ApiError,
  type Post,
  type CreatePostPayload,
  type UpdatePostPayload,
  type CertificationCode,
} from "@safyr/api-client";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCreatePost, useUpdatePost } from "@/hooks/sites";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  existing?: Post | null;
}

const CERT_OPTIONS: { value: CertificationCode; label: string }[] = [
  { value: "CNAPS", label: "CNAPS" },
  { value: "CQP_APS", label: "CQP/APS" },
  { value: "SSIAP1", label: "SSIAP 1" },
  { value: "SSIAP2", label: "SSIAP 2" },
  { value: "SSIAP3", label: "SSIAP 3" },
  { value: "SST", label: "SST" },
  { value: "VM", label: "Visite médicale" },
  { value: "H0B0", label: "H0B0" },
  { value: "FIRE", label: "Incendie" },
];

const empty: CreatePostDto = {
  name: "",
  description: "",
  requiredCertifications: [],
  defaultStartTime: "",
  defaultEndTime: "",
  active: true,
};

function toDto(p: Post): CreatePostDto {
  return {
    name: p.name,
    description: p.description ?? "",
    requiredCertifications: p.requiredCertifications,
    defaultStartTime: p.defaultStartTime ?? "",
    defaultEndTime: p.defaultEndTime ?? "",
    active: p.active,
  };
}

export function PostFormDialog({ open, onOpenChange, siteId, existing }: Props) {
  const isEdit = !!existing;
  const createMutation = useCreatePost(siteId);
  const updateMutation = useUpdatePost(siteId);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const defaultValues = useMemo<CreatePostDto>(
    () => (existing ? toDto(existing) : empty),
    [existing],
  );

  const form = useForm({
    defaultValues,
    validators: { onChange: CreatePostSchema },
    onSubmit: async ({ value }) => {
      setGlobalError(null);
      try {
        const payload = {
          ...value,
          description: value.description?.trim() || undefined,
          defaultStartTime: value.defaultStartTime?.trim() || undefined,
          defaultEndTime: value.defaultEndTime?.trim() || undefined,
        };
        if (isEdit && existing) {
          await updateMutation.mutateAsync({
            postId: existing.id,
            data: payload as UpdatePostPayload,
          });
        } else {
          await createMutation.mutateAsync(payload as CreatePostPayload);
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
      title={isEdit ? "Modifier le poste" : "Nouveau poste"}
      description="Poste de garde rattaché à ce site"
      actions={{
        secondary: {
          label: "Annuler",
          onClick: () => onOpenChange(false),
          variant: "outline",
        },
        primary: {
          label: pending ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer",
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
        <form.Field name="name">
          {(field: AnyFieldApi) => (
            <div className="space-y-2">
              <Label>Nom du poste *</Label>
              <Input
                value={(field.state.value as string) ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Accueil principal"
              />
              <FieldError field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="description">
          {(field: AnyFieldApi) => (
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={(field.state.value as string) ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Missions principales du poste…"
                rows={2}
              />
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-2 gap-3">
          <form.Field name="defaultStartTime">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Heure de début</Label>
                <Input
                  type="time"
                  value={(field.state.value as string) ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError field={field} />
              </div>
            )}
          </form.Field>
          <form.Field name="defaultEndTime">
            {(field: AnyFieldApi) => (
              <div className="space-y-2">
                <Label>Heure de fin</Label>
                <Input
                  type="time"
                  value={(field.state.value as string) ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError field={field} />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="requiredCertifications">
          {(field: AnyFieldApi) => {
            const current = (field.state.value as CertificationCode[]) ?? [];
            const toggle = (code: CertificationCode) => {
              const exists = current.includes(code);
              field.handleChange(
                exists ? current.filter((c) => c !== code) : [...current, code],
              );
            };
            return (
              <div className="space-y-2">
                <Label>Certifications requises</Label>
                <div className="flex flex-wrap gap-2">
                  {CERT_OPTIONS.map((opt) => {
                    const selected = current.includes(opt.value);
                    return (
                      <Badge
                        key={opt.value}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => toggle(opt.value)}
                      >
                        {opt.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          }}
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
