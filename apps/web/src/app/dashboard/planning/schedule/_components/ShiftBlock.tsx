"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  Copy,
  Lock,
  Moon,
  MoreVertical,
  Pencil,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";

import type { AgentShift } from "@/lib/types";
import type { DateConflict } from "./types";

export function ShiftBlock({
  shift,
  conflict,
  isClosed,
  onEdit,
  onDelete,
  onCopy,
  onConflictClick,
  onCustomizeHours,
}: {
  shift: AgentShift;
  conflict: DateConflict | null;
  isClosed?: boolean;
  onEdit: (shift: AgentShift) => void;
  onDelete: (shiftId: string) => void;
  onCopy: (shift: AgentShift) => void;
  onConflictClick: (agentId: string, date: string) => void;
  onCustomizeHours: (shift: AgentShift) => void;
}) {
  const [startHour, startMin] = shift.startTime.split(":").map(Number);
  const [endHour, endMin] = shift.endTime.split(":").map(Number);

  const startPercent = ((startHour * 60 + startMin) / (24 * 60)) * 100;
  let endPercent = ((endHour * 60 + endMin) / (24 * 60)) * 100;

  if (endPercent <= startPercent) {
    endPercent = 100;
  }

  const widthPercent = endPercent - startPercent;

  const calculateDuration = () => {
    let minutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    if (minutes < 0) minutes += 24 * 60;
    minutes -= shift.breakDuration;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0
      ? `${hours}h${mins.toString().padStart(2, "0")}`
      : `${hours}h`;
  };

  const calculateTotalDuration = () => {
    let minutes1 = endHour * 60 + endMin - (startHour * 60 + startMin);
    if (minutes1 < 0) minutes1 += 24 * 60;
    minutes1 -= shift.breakDuration;

    let minutes2 = 0;
    if (shift.isSplit && shift.splitStartTime2 && shift.splitEndTime2) {
      const [s2h, s2m] = shift.splitStartTime2.split(":").map(Number);
      const [e2h, e2m] = shift.splitEndTime2.split(":").map(Number);
      minutes2 = e2h * 60 + e2m - (s2h * 60 + s2m);
      if (minutes2 < 0) minutes2 += 24 * 60;
      minutes2 -= shift.splitBreakDuration || 0;
    }

    const totalMinutes = minutes1 + minutes2;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0
      ? `${hours}h${mins.toString().padStart(2, "0")}`
      : `${hours}h`;
  };

  const isShiftInPast = (s: AgentShift) => {
    const check = new Date(s.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    check.setHours(0, 0, 0, 0);
    return check < today;
  };

  const getShiftCompletionStatus = (s: AgentShift) => {
    if (!isShiftInPast(s)) return null;
    if (s.completed)
      return {
        type: "completed",
        label: "Terminé",
        color: "#10b981",
        icon: CheckCircle,
      };
    if (s.noShow)
      return {
        type: "no_show",
        label: "Absent",
        color: "#ef4444",
        icon: XCircle,
      };
    return {
      type: "pending",
      label: "En attente",
      color: "#f59e0b",
      icon: Timer,
    };
  };

  const isPast = isShiftInPast(shift);
  const completionStatus = getShiftCompletionStatus(shift);
  const duration = calculateDuration();

  const isOvernight = endPercent >= 100;
  const continuesNextDay =
    endHour < startHour || (endHour === 0 && endMin === 0 && startHour !== 0);

  return (
    <div
      className={`absolute top-2 bottom-2 border-l-4 flex flex-col p-3 group cursor-pointer shadow-sm hover:shadow-md transition-all overflow-hidden ${
        isPast ? "opacity-80" : ""
      }`}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        backgroundColor: shift.color,
        borderLeftColor: shift.color,
        borderRadius: isOvernight ? "0.5rem 0 0 0.5rem" : "0.5rem",
      }}
      onClick={() => onEdit(shift)}
    >
      {isOvernight && continuesNextDay && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40" />
          <div
            className="absolute right-0 top-0 bottom-0 w-8 opacity-20"
            style={{
              background:
                "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)",
            }}
          />
        </>
      )}
      {conflict && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConflictClick(shift.agentId, shift.date);
          }}
          className="absolute -top-1 -right-1 z-10 p-1 bg-white rounded-full shadow-md"
        >
          {conflict.type === "time_off" ? (
            <Ban className="h-4 w-4 text-red-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </button>
      )}
      {isClosed && !conflict && (
        <div
          className="absolute -top-1 -right-1 z-10 p-1 bg-white rounded-full shadow-md"
          title="Poste planifié un jour fermé"
        >
          <Lock className="h-3.5 w-3.5 text-orange-500" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate flex items-center gap-2">
            {continuesNextDay && <Moon className="h-3.5 w-3.5 shrink-0" />}
            {shift.startTime} - {shift.endTime}
            {shift.isSplit && (
              <span className="text-xs font-normal text-white/80">
                | {shift.splitStartTime2} - {shift.splitEndTime2}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge
              variant="secondary"
              className="text-xs h-5 bg-white/20 text-white border-0"
            >
              <Clock className="h-3 w-3 mr-1" />
              {shift.isSplit ? calculateTotalDuration() : duration}
            </Badge>
            {shift.isSplit && shift.splitBreakDuration && (
              <span className="text-xs text-white/80">
                Pause: {shift.splitBreakDuration}min
              </span>
            )}
            {shift.breakDuration > 0 && !shift.isSplit && (
              <span className="text-xs text-white/80">
                Pause: {shift.breakDuration}min
              </span>
            )}
            {completionStatus && (
              <Badge
                variant="secondary"
                className="text-xs h-5 font-semibold border-0 gap-1"
                style={{
                  backgroundColor: completionStatus.color,
                  color: "#fff",
                }}
                title={
                  completionStatus.label === "Terminé"
                    ? "Agent a complété son service"
                    : completionStatus.label === "Absent"
                      ? "Agent n'a pas assuré son service"
                      : "Statut de présence non encore confirmé"
                }
              >
                <completionStatus.icon className="h-3 w-3" />
                {completionStatus.label}
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 hover:bg-white/20 bg-white/10 rounded shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(shift);
              }}
            >
              <Pencil className="h-4 w-4 mr-2 text-orange-500" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCustomizeHours(shift);
              }}
            >
              <Clock className="h-4 w-4 mr-2 text-blue-500" />
              Personnaliser horaires
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCopy(shift);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(shift.id);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2 text-red-600" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {shift.notes && (
        <div className="text-xs text-white/80 truncate mt-1">{shift.notes}</div>
      )}

      {/* Quick-edit action — bottom right */}
      <Button
        size="sm"
        variant="ghost"
        className="absolute bottom-1.5 right-1.5 h-7 w-7 p-0 rounded bg-white/15 hover:bg-white/30 text-white shrink-0 z-10"
        title="Modifier le shift"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(shift);
        }}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
