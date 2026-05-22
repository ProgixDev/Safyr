"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import {
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { useTimeEntries } from "@/hooks/time-entries";
import type { TimeEntry } from "@safyr/api-client";

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(fromIso: string, toIso?: string | null): string {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((to - from) / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function memberName(entry: TimeEntry): string {
  const m = entry.member;
  if (!m) return "—";
  const full = [m.firstName, m.lastName].filter(Boolean).join(" ");
  return full || m.employeeNumber || "—";
}

export default function PointagePage() {
  const { data, isLoading } = useTimeEntries({
    from: startOfTodayIso(),
    status: "all",
  });

  const entries = useMemo<TimeEntry[]>(() => data ?? [], [data]);
  const active = entries.filter((e) => e.clockOutAt === null);
  const closed = entries.filter((e) => e.clockOutAt !== null);

  const totalMinutesToday = entries.reduce((acc, e) => {
    const from = new Date(e.clockInAt).getTime();
    const to = e.clockOutAt ? new Date(e.clockOutAt).getTime() : Date.now();
    return acc + Math.max(0, (to - from) / 60_000);
  }, 0);

  const totalHoursLabel = `${Math.floor(totalMinutesToday / 60)}h${Math.floor(
    totalMinutesToday % 60,
  )
    .toString()
    .padStart(2, "0")}`;

  const distinctMembers = new Set(entries.map((e) => e.memberId)).size;

  const columns: ColumnDef<TimeEntry>[] = [
    {
      key: "status",
      label: "Statut",
      render: (entry) =>
        entry.clockOutAt === null ? (
          <Badge variant="default" className="gap-1">
            <Activity className="h-3 w-3" />
            En service
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Terminé
          </Badge>
        ),
    },
    {
      key: "agent",
      label: "Agent",
      sortable: true,
      sortValue: memberName,
      render: (entry) => (
        <div>
          <div className="font-medium">{memberName(entry)}</div>
          {entry.member?.employeeNumber && (
            <div className="text-xs text-muted-foreground">
              {entry.member.employeeNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "site",
      label: "Site",
      render: (entry) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          {entry.siteName ?? "—"}
        </div>
      ),
    },
    {
      key: "clockIn",
      label: "Prise de service",
      sortable: true,
      sortValue: (entry) => entry.clockInAt,
      render: (entry) => (
        <span className="text-sm">{formatTime(entry.clockInAt)}</span>
      ),
    },
    {
      key: "clockOut",
      label: "Fin de service",
      render: (entry) => (
        <span className="text-sm">
          {entry.clockOutAt ? formatTime(entry.clockOutAt) : "—"}
        </span>
      ),
    },
    {
      key: "duration",
      label: "Durée",
      render: (entry) => (
        <span className="text-sm font-medium tabular-nums">
          {formatDuration(entry.clockInAt, entry.clockOutAt)}
        </span>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (entry) => (
        <Badge variant="outline" className="uppercase">
          {entry.source}
        </Badge>
      ),
    },
    {
      key: "gps",
      label: "GPS",
      render: (entry) =>
        entry.clockInLat != null && entry.clockInLng != null ? (
          <span className="text-xs font-mono text-muted-foreground">
            {entry.clockInLat.toFixed(4)}, {entry.clockInLng.toFixed(4)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-7 w-7" />
            Pointage GPS
          </h1>
          <p className="text-muted-foreground">
            Vacations agents en temps réel — rapprochement planning / présence
            terrain
          </p>
        </div>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={Activity}
          title="En service"
          value={active.length}
          subtext={`sur ${distinctMembers} agent(s) pointé(s) aujourd'hui`}
          color="green"
        />
        <InfoCard
          icon={CheckCircle2}
          title="Vacations clôturées"
          value={closed.length}
          subtext="aujourd'hui"
          color="blue"
        />
        <InfoCard
          icon={Clock}
          title="Heures cumulées"
          value={totalHoursLabel}
          subtext="présence totale"
          color="purple"
        />
        <InfoCard
          icon={Users}
          title="Agents distincts"
          value={distinctMembers}
          subtext="ayant pointé"
          color="gray"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vacations du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={entries}
            isLoading={isLoading}
            columns={columns}
            searchKeys={["siteName", "source"]}
            getSearchValue={(entry) =>
              `${memberName(entry)} ${entry.siteName ?? ""} ${entry.source}`
            }
            searchPlaceholder="Rechercher par agent, site, source…"
            filters={[
              {
                key: "status",
                label: "Statut",
                options: [
                  { value: "all", label: "Tous" },
                  { value: "open", label: "En service" },
                  { value: "closed", label: "Terminé" },
                ],
              },
              {
                key: "source",
                label: "Source",
                options: [
                  { value: "all", label: "Toutes" },
                  { value: "gps", label: "GPS" },
                  { value: "qr", label: "QR code" },
                  { value: "manual", label: "Manuel" },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
