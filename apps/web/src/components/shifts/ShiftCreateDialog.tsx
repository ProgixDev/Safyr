"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, type ShiftStatus } from "@safyr/api-client";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateShift } from "@/hooks/shifts";
import { useSites } from "@/hooks/sites";
import { useEmployees } from "@/hooks/employees";
import { usePlanningTimeOff, congeADate } from "@/hooks/planning";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function defaultStart(date?: Date): string {
  const d = new Date(date ?? new Date());
  d.setHours(7, 0, 0, 0);
  return toLocalInputValue(d);
}

function defaultEnd(date?: Date): string {
  const d = new Date(date ?? new Date());
  d.setHours(19, 0, 0, 0);
  return toLocalInputValue(d);
}

export function ShiftCreateDialog({ open, onOpenChange, defaultDate }: Props) {
  const sitesQ = useSites();
  const employeesQ = useEmployees();
  const mutation = useCreateShift();
  const { timeOffRequests } = usePlanningTimeOff();

  const [siteId, setSiteId] = useState<string>("");
  const [postId, setPostId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");
  const [startAt, setStartAt] = useState<string>(defaultStart(defaultDate));
  const [endAt, setEndAt] = useState<string>(defaultEnd(defaultDate));
  const [status, setStatus] = useState<ShiftStatus>("planned");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSiteId("");
      setPostId("");
      setMemberId("");
      setStartAt(defaultStart(defaultDate));
      setEndAt(defaultEnd(defaultDate));
      setStatus("planned");
      setNotes("");
      setError(null);
    }
  }, [open, defaultDate]);

  const sites = sitesQ.data ?? [];
  const employees = employeesQ.data ?? [];

  const selectedSite = sites.find((s) => s.id === siteId);
  const posts = selectedSite?.posts ?? [];
  const selectedPost = posts.find((p) => p.id === postId);

  useEffect(() => {
    if (!selectedPost) return;
    if (!selectedPost.defaultStartTime || !selectedPost.defaultEndTime) return;
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const [sh, sm] = selectedPost.defaultStartTime.split(":").map(Number);
    const [eh, em] = selectedPost.defaultEndTime.split(":").map(Number);
    const newStart = new Date(startDate);
    newStart.setHours(sh, sm, 0, 0);
    const newEnd = new Date(endDate);
    newEnd.setHours(eh, em, 0, 0);
    setStartAt(toLocalInputValue(newStart));
    setEndAt(toLocalInputValue(newEnd));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPost?.id]);

  // Un agent en congé/absence approuvé(e) sur cette date : avant, rien ne le
  // signalait dans cette fenêtre (contrairement à la grille du planning).
  const congeEnConflit = useMemo(
    () =>
      memberId && startAt
        ? congeADate(memberId, new Date(startAt), timeOffRequests)
        : null,
    [memberId, startAt, timeOffRequests],
  );

  const canSubmit = useMemo(
    () =>
      !!postId &&
      !!startAt &&
      !!endAt &&
      new Date(endAt) > new Date(startAt) &&
      !congeEnConflit &&
      !mutation.isPending,
    [postId, startAt, endAt, congeEnConflit, mutation.isPending],
  );

  async function handleSubmit() {
    setError(null);
    if (!canSubmit) return;
    try {
      await mutation.mutateAsync({
        postId,
        memberId: memberId || null,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        status,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Échec de la création";
      setError(message);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      type="form"
      size="md"
      title="Nouvelle vacation"
      description="Affecter un agent à un poste pour un créneau horaire"
      actions={{
        secondary: {
          label: "Annuler",
          onClick: () => onOpenChange(false),
          variant: "outline",
        },
        primary: {
          label: mutation.isPending ? "Création..." : "Créer la vacation",
          onClick: handleSubmit,
          disabled: !canSubmit,
        },
      }}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Site *</Label>
            <Select
              value={siteId}
              onValueChange={(v) => {
                setSiteId(v);
                setPostId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un site" />
              </SelectTrigger>
              <SelectContent>
                {sites.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    Aucun site
                  </SelectItem>
                ) : (
                  sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.clientName ? ` — ${s.clientName}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Poste *</Label>
            <Select value={postId} onValueChange={setPostId} disabled={!siteId}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !siteId
                      ? "Choisir d'abord un site"
                      : posts.length === 0
                        ? "Aucun poste sur ce site"
                        : "Choisir un poste"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {posts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.defaultStartTime && p.defaultEndTime
                      ? ` (${p.defaultStartTime}–${p.defaultEndTime})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Agent (optionnel)</Label>
          <Select
            value={memberId || "__unassigned"}
            onValueChange={(v) => setMemberId(v === "__unassigned" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="À pourvoir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned">À pourvoir</SelectItem>
              {employees.map((e) => {
                const name =
                  [e.firstName, e.lastName].filter(Boolean).join(" ") ||
                  e.user.email;
                return (
                  <SelectItem key={e.id} value={e.id}>
                    {name}
                    {e.employeeNumber ? ` (${e.employeeNumber})` : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {congeEnConflit && (
            <p className="text-sm text-destructive" role="alert">
              Agent en congé ({congeEnConflit.type === "sick_leave" ? "arrêt maladie" : "congé"}{" "}
              approuvé du{" "}
              {new Date(congeEnConflit.startDate).toLocaleDateString("fr-FR")}{" "}
              au {new Date(congeEnConflit.endDate).toLocaleDateString("fr-FR")}) —
              choisissez un autre agent ou une autre date.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Début *</Label>
            <Input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Fin *</Label>
            <Input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ShiftStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planifié</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
              <SelectItem value="completed">Effectué</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Consignes spécifiques pour ce shift…"
            rows={2}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
