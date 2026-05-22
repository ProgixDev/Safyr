"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Modal } from "@/components/ui/modal";
import { useDeleteShift, useShifts } from "@/hooks/shifts";
import type { Shift } from "@safyr/api-client";
import { ShiftCreateDialog } from "@/components/shifts/ShiftCreateDialog";

const STATUS_LABEL: Record<Shift["status"], string> = {
  planned: "Planifié",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  completed: "Effectué",
};

const STATUS_VARIANT: Record<
  Shift["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  planned: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
};

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday-based
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function formatDay(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function VacationsPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data, isLoading } = useShifts({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  });
  const shifts = useMemo<Shift[]>(() => data ?? [], [data]);

  const deleteMutation = useDeleteShift();
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<Date | null>(null);
  const [toDelete, setToDelete] = useState<Shift | null>(null);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const day of days) {
      map.set(day.toDateString(), []);
    }
    for (const s of shifts) {
      const key = new Date(s.startAt).toDateString();
      const list = map.get(key);
      if (list) list.push(s);
    }
    return map;
  }, [shifts, days]);

  const total = shifts.length;
  const assigned = shifts.filter((s) => s.memberId).length;
  const toFill = total - assigned;
  const confirmed = shifts.filter((s) => s.status === "confirmed").length;

  function shiftToday() {
    setWeekStart(startOfWeek(new Date()));
  }

  function openCreate(date?: Date) {
    setCreateDefaultDate(date ?? new Date());
    setCreateOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-7 w-7" />
            Planning des vacations
          </h1>
          <p className="text-muted-foreground">
            Affectation des agents aux postes par semaine
          </p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle vacation
        </Button>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={Calendar}
          title="Vacations cette semaine"
          value={total}
          subtext={`du ${weekStart.toLocaleDateString("fr-FR")} au ${addDays(
            weekStart,
            6,
          ).toLocaleDateString("fr-FR")}`}
          color="blue"
        />
        <InfoCard
          icon={Users}
          title="Affectées"
          value={assigned}
          subtext={`${total === 0 ? 0 : Math.round((assigned / total) * 100)}% du planning`}
          color="green"
        />
        <InfoCard
          icon={Clock}
          title="À pourvoir"
          value={toFill}
          subtext="agents à affecter"
          color={toFill > 0 ? "orange" : "gray"}
        />
        <InfoCard
          icon={CheckCircle2}
          title="Confirmées"
          value={confirmed}
          subtext={`${total === 0 ? 0 : Math.round((confirmed / total) * 100)}% confirmées`}
          color="purple"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Semaine du {weekStart.toLocaleDateString("fr-FR")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={shiftToday}>
              Aujourd&apos;hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Chargement…
            </p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {days.map((d) => {
                const dayShifts = shiftsByDay.get(d.toDateString()) ?? [];
                const isToday = isSameDay(d, new Date());
                return (
                  <div
                    key={d.toISOString()}
                    className={`rounded-lg border p-2 min-h-[200px] flex flex-col gap-2 ${
                      isToday ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium uppercase ${
                          isToday ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {formatDay(d)}
                      </span>
                      <button
                        onClick={() => openCreate(d)}
                        className="text-xs text-primary hover:underline"
                      >
                        +
                      </button>
                    </div>
                    {dayShifts.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center mt-4">
                        —
                      </p>
                    ) : (
                      dayShifts
                        .sort(
                          (a, b) =>
                            new Date(a.startAt).getTime() -
                            new Date(b.startAt).getTime(),
                        )
                        .map((s) => (
                          <div
                            key={s.id}
                            className="rounded-md border bg-card p-2 text-xs space-y-1 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                {formatTime(s.startAt)} → {formatTime(s.endAt)}
                              </span>
                              <button
                                onClick={() => setToDelete(s)}
                                className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="text-muted-foreground truncate">
                              {s.post?.site.name ?? "—"}
                            </div>
                            <div className="font-medium truncate">
                              {s.post?.name ?? "—"}
                            </div>
                            {s.memberId ? (
                              <Badge variant={STATUS_VARIANT[s.status]}>
                                {STATUS_LABEL[s.status]}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-orange-500/40 text-orange-600"
                              >
                                À pourvoir
                              </Badge>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ShiftCreateDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateDefaultDate(null);
        }}
        defaultDate={createDefaultDate ?? undefined}
      />

      <Modal
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        type="warning"
        title="Supprimer cette vacation"
        description="Cette action est irréversible."
        closable={false}
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setToDelete(null),
            variant: "outline",
          },
          primary: {
            label: deleteMutation.isPending ? "Suppression..." : "Supprimer",
            variant: "destructive",
            disabled: deleteMutation.isPending,
            onClick: async () => {
              if (!toDelete) return;
              await deleteMutation.mutateAsync(toDelete.id);
              setToDelete(null);
            },
          },
        }}
      >
        {toDelete && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {toDelete.post?.site.name} · {toDelete.post?.name}
            </span>
            <br />
            {new Date(toDelete.startAt).toLocaleString("fr-FR")} →{" "}
            {new Date(toDelete.endAt).toLocaleString("fr-FR")}
          </p>
        )}
      </Modal>
    </div>
  );
}
