"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Ban,
  CalendarOff,
  Clipboard,
  Copy,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";

import type { AgentShift } from "@/lib/types";
import type { SiteColor } from "@/lib/site-colors";
import { getSiteColorClasses } from "@/lib/site-colors";
import { mockPostes } from "@/data/sites";
import type { DateConflict } from "./types";
import { ShiftCard } from "./ShiftCard";
import { summarizeAgentHours } from "./contract-utils";
import { AgentHoursCell } from "./AgentHoursCell";
import {
  inferPosteWindow,
  computeUncoveredIntervals,
  formatHourLabel,
  getPosteRequirementForDay,
} from "./besoin-utils";
import { isoWeekNumber } from "./date-utils";

export function WeeklyView({
  dates,
  agents,
  shifts,
  allShifts,
  copiedShift,
  copiedWeekDates,
  copiedWeekAgentId,
  onCreateShift,
  onEditShift,
  onDeleteShift,
  onCopyShift,
  onPasteShift,
  onCopyWeek,
  onPasteWeek,
  onDeleteWeek,
  onConflictClick,
  getDateConflict,
  onCustomizeShiftHours,
  isClosedDay,
  selectedSiteId,
  siteColor,
}: {
  dates: Date[];
  agents: { agentId: string; agentName: string }[];
  shifts: AgentShift[];
  allShifts: AgentShift[];
  copiedShift: AgentShift | null;
  copiedWeekDates: string[] | null;
  copiedWeekAgentId: string | null;
  onCreateShift: (agentId: string, date: string) => void;
  onEditShift: (shift: AgentShift) => void;
  onDeleteShift: (shiftId: string) => void;
  onCopyShift: (shift: AgentShift) => void;
  onPasteShift: (agentId: string, date: string) => void;
  onCopyWeek: (agentId: string, dates: string[]) => void;
  onPasteWeek: (agentId: string, dates: string[]) => void;
  onDeleteWeek: (agentId: string, dates: string[]) => void;
  onConflictClick: (agentId: string, date: string) => void;
  getDateConflict: (agentId: string, date: string) => DateConflict | null;
  onCustomizeShiftHours: (shift: AgentShift) => void;
  isClosedDay: (date: Date | string) => boolean;
  selectedSiteId: string | null;
  siteColor: SiteColor;
}) {
  const colors = getSiteColorClasses(siteColor);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const isDateInPast = (d: string | Date) => {
    const check = typeof d === "string" ? new Date(d) : d;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    check.setHours(0, 0, 0, 0);
    return check < today;
  };

  const weekDates = dates.map(formatDate);
  const showActions = true;
  const sitePostes = useMemo(
    () =>
      selectedSiteId
        ? mockPostes.filter((p) => p.siteId === selectedSiteId)
        : [],
    [selectedSiteId],
  );

  const MIN_COL_WIDTH = 100;
  const MIN_TOTAL = 224 + 8 + dates.length * (MIN_COL_WIDTH + 8) + 40;

  return (
    <div className="overflow-x-auto">
      {/* Week-number pill — centered over the weekdays row */}
      {dates.length > 0 &&
        (() => {
          const midIdx = Math.floor(dates.length / 2);
          const refDate = dates[midIdx];
          const weekNum = isoWeekNumber(refDate);
          const today = new Date();
          const isCurrentWeek =
            isoWeekNumber(today) === weekNum &&
            today.getFullYear() === refDate.getFullYear();
          return (
            <div className="flex mb-3" style={{ minWidth: `${MIN_TOTAL}px` }}>
              <div className="w-56 shrink-0" />
              <div className="flex-1 flex justify-center">
                <span
                  className={`inline-flex items-center h-10 px-6 rounded-full text-base font-bold tracking-wide border-2 transition ${
                    isCurrentWeek
                      ? "bg-primary text-primary-foreground border-primary shadow-md ring-4 ring-primary/25"
                      : "bg-background border-border text-foreground"
                  }`}
                >
                  Semaine {String(weekNum).padStart(2, "0")}
                </span>
              </div>
              <div className="w-10 shrink-0" />
            </div>
          );
        })()}

      {/* Header with dates as x-axis */}
      <div className="flex mb-4 gap-2" style={{ minWidth: `${MIN_TOTAL}px` }}>
        <div className="w-56 shrink-0" />
        <div className="flex-1 flex gap-2">
          {dates.map((date: Date, idx: number) => (
            <div
              key={idx}
              className="flex-1 text-center p-3 rounded-lg"
              style={{ minWidth: `${MIN_COL_WIDTH}px` }}
            >
              <div className="text-sm font-medium">
                {date.toLocaleDateString("fr-FR", { weekday: "short" })}
              </div>
              <div className="text-xs text-muted-foreground">
                {date.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </div>
          ))}
          <div className="w-10 shrink-0" />
        </div>
      </div>

      {/* Besoin rows — one per poste */}
      {sitePostes.length > 0 && (
        <div className="space-y-1 mb-3" style={{ minWidth: `${MIN_TOTAL}px` }}>
          {sitePostes.map((poste) => {
            const win = inferPosteWindow(poste);
            return (
              <div key={poste.id} className="flex items-stretch gap-2">
                <div
                  className={`w-56 shrink-0 px-3 py-1.5 rounded-md ${colors.bgMuted} flex items-center gap-2`}
                  title={`${poste.name} · ${win.start}–${win.end}`}
                >
                  <span className="text-xs font-medium truncate">
                    {poste.name}
                  </span>
                </div>
                <div className="flex-1 flex gap-2">
                  {dates.map((date) => {
                    const dateStr = formatDate(date);
                    const isClosed = isClosedDay(date);
                    const required = getPosteRequirementForDay(
                      poste,
                      date.getDay(),
                    );
                    const gaps = computeUncoveredIntervals(
                      shifts,
                      poste,
                      dateStr,
                    );
                    const complete = required > 0 && gaps.length === 0;
                    return (
                      <div
                        key={dateStr}
                        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-md border ${isClosed ? "bg-muted/30 border-border/30" : complete ? "bg-green-500/10 border-green-500/40" : required === 0 ? "bg-muted/20 border-border/30" : "bg-amber-500/10 border-amber-500/40"}`}
                        style={{ minWidth: `${MIN_COL_WIDTH}px` }}
                      >
                        {isClosed || required === 0 ? (
                          <span className="text-[10px] text-muted-foreground">
                            —
                          </span>
                        ) : complete ? (
                          <span className="text-xs font-bold text-green-600 uppercase tracking-wide">
                            Affecter
                          </span>
                        ) : (
                          <>
                            <span className="text-[10px] font-medium text-muted-foreground tracking-tight">
                              {win.start}–{win.end}
                            </span>
                            <span
                              className="text-xs font-semibold text-amber-700 tracking-tight"
                              title="Plage restante à couvrir"
                            >
                              {gaps
                                .map(
                                  (g) =>
                                    `${formatHourLabel(g.start)}–${formatHourLabel(g.end)}`,
                                )
                                .join(", ")}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                {dates.length >= 7 && <div className="w-12 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Agent rows */}
      <div className="space-y-3" style={{ minWidth: `${MIN_TOTAL}px` }}>
        {agents.map(({ agentId, agentName }) => {
          const hasAnyShift = weekDates.some((date) =>
            shifts.find((s) => s.agentId === agentId && s.date === date),
          );

          const hasWeekConflicts = weekDates.some((date) => {
            const conflict = getDateConflict(agentId, date);
            return conflict !== null;
          });

          const showWeekPasteBlock =
            copiedWeekDates &&
            copiedWeekAgentId &&
            !hasAnyShift &&
            !hasWeekConflicts &&
            weekDates.every((d) => !isDateInPast(d));

          // Contract hours scoped to the visible week
          const hours = summarizeAgentHours(agentId, allShifts, dates);

          return (
            <div key={agentId} className="flex items-stretch gap-2">
              <div className="w-56 shrink-0 p-3 bg-muted rounded-lg flex flex-col justify-center gap-1">
                <div className="font-medium text-sm">{agentName}</div>
                <AgentHoursCell summary={hours} />
              </div>

              <div className="flex-1 relative flex gap-2">
                {dates.map((date: Date, idx: number) => {
                  const dateStr = formatDate(date);
                  const shift = shifts.find(
                    (s) => s.agentId === agentId && s.date === dateStr,
                  );
                  const conflict = getDateConflict(agentId, dateStr);
                  const isClosed = isClosedDay(date);

                  return (
                    <div
                      key={idx}
                      className={`flex-1 border rounded-lg relative overflow-hidden ${
                        isClosed ? "bg-muted/30" : "bg-background"
                      } ${showWeekPasteBlock ? "invisible" : ""}`}
                      style={{
                        minWidth: `${MIN_COL_WIDTH}px`,
                        height: "80px",
                      }}
                    >
                      {shift ? (
                        <ShiftCard
                          shift={shift}
                          isClosed={isClosed}
                          onEdit={onEditShift}
                          onDelete={onDeleteShift}
                          onCopy={onCopyShift}
                          onCustomizeHours={onCustomizeShiftHours}
                        />
                      ) : conflict?.type === "time_off" ? (
                        <button
                          onClick={() => onConflictClick(agentId, dateStr)}
                          className="absolute inset-2 flex items-center justify-center gap-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors border border-red-200"
                        >
                          <Ban className="h-4 w-4" />
                          <span className="text-sm font-medium">Congé</span>
                        </button>
                      ) : conflict?.type === "double_booking" ? (
                        <button
                          onClick={() => onConflictClick(agentId, dateStr)}
                          disabled
                          className="absolute inset-2 flex items-center justify-center gap-2 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-300 cursor-not-allowed opacity-75"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Double affectation
                          </span>
                        </button>
                      ) : isClosed ? (
                        <button
                          onClick={() =>
                            copiedShift
                              ? onPasteShift(agentId, dateStr)
                              : onCreateShift(agentId, dateStr)
                          }
                          className="absolute inset-2 flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/20 text-muted-foreground/50 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-colors group"
                          title="Jour fermé — cliquer pour forcer l'ajout"
                        >
                          <CalendarOff className="h-4 w-4" />
                          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Forcer
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            copiedShift
                              ? onPasteShift(agentId, dateStr)
                              : onCreateShift(agentId, dateStr)
                          }
                          className="absolute inset-2 flex items-center justify-center gap-2 rounded-lg hover:bg-primary/10 transition-colors group border border-dashed border-muted-foreground/30"
                        >
                          {copiedShift ? (
                            <>
                              <Clipboard className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                              <span className="text-sm text-muted-foreground group-hover:text-primary">
                                Coller
                              </span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}

                {showWeekPasteBlock && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => onPasteWeek(agentId, weekDates)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Clipboard className="h-6 w-6 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        Coller la semaine
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {showActions && (
                <div className="w-12 shrink-0 h-24 flex items-center justify-center bg-muted/50 rounded-lg">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-muted"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {hasAnyShift && (
                        <>
                          <DropdownMenuItem
                            onClick={() => onCopyWeek(agentId, weekDates)}
                          >
                            <Copy className="h-3 w-3 mr-2" />
                            Copier la semaine
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteWeek(agentId, weekDates)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-2 text-red-600" />
                            Vider la semaine
                          </DropdownMenuItem>
                        </>
                      )}
                      {!hasAnyShift && (
                        <DropdownMenuItem
                          onClick={() => onDeleteWeek(agentId, weekDates)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-2 text-red-600" />
                          Vider la semaine
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
