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

export function ShiftCard({
  shift,
  isClosed,
  onEdit,
  onDelete,
  onCopy,
  onCustomizeHours,
}: {
  shift: AgentShift;
  isClosed?: boolean;
  onEdit: (shift: AgentShift) => void;
  onDelete: (shiftId: string) => void;
  onCopy: (shift: AgentShift) => void;
  onCustomizeHours: (shift: AgentShift) => void;
}) {
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

  const isOvernightShift = (startTime: string, endTime: string) => {
    const [startHour] = startTime.split(":").map(Number);
    const [endHour] = endTime.split(":").map(Number);
    return endHour < startHour;
  };

  const calculateShiftLength = (
    startTime: string,
    endTime: string,
    breakDuration: number,
  ) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    let minutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    if (minutes < 0) minutes += 24 * 60;
    minutes -= breakDuration;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0
      ? `${hours}h${mins.toString().padStart(2, "0")}`
      : `${hours}h`;
  };

  const calculateTotalDuration = () => {
    const [startHour, startMin] = shift.startTime.split(":").map(Number);
    const [endHour, endMin] = shift.endTime.split(":").map(Number);
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

  const isPast = isShiftInPast(shift);
  const completionStatus = getShiftCompletionStatus(shift);

  return (
    <div
      className={`absolute inset-0 rounded p-1 border-l-3 flex flex-col group cursor-pointer shadow-sm hover:shadow-md transition-all overflow-hidden ${
        isPast ? "opacity-80" : ""
      }`}
      style={{
        borderLeftColor: shift.color,
        backgroundColor: shift.color,
      }}
      onClick={() => onEdit(shift)}
    >
      {isClosed && (
        <div
          className="absolute top-0.5 right-0.5 z-10"
          title="Poste planifié un jour fermé"
        >
          <Lock className="h-2.5 w-2.5 text-white/80" />
        </div>
      )}
      {completionStatus && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: completionStatus.color }}
        />
      )}

      <div className="flex items-start justify-between gap-1 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-white truncate flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              {isOvernightShift(shift.startTime, shift.endTime) && (
                <Moon className="h-2.5 w-2.5 shrink-0" />
              )}
              {shift.startTime}-{shift.endTime}
            </div>
            {shift.isSplit && (
              <div className="text-[9px] font-normal text-white/80">
                {shift.splitStartTime2}-{shift.splitEndTime2}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">
            <Badge
              variant="secondary"
              className="text-[9px] h-4 px-1 bg-white/20 text-white border-0"
            >
              {shift.isSplit
                ? calculateTotalDuration()
                : calculateShiftLength(
                    shift.startTime,
                    shift.endTime,
                    shift.breakDuration,
                  )}
            </Badge>
            {completionStatus && (
              <span
                title={
                  completionStatus.label === "Terminé"
                    ? "Agent a complété son service"
                    : completionStatus.label === "Absent"
                      ? "Agent n'a pas assuré son service"
                      : "Statut de présence non encore confirmé"
                }
              >
                <completionStatus.icon className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 hover:bg-white/20 bg-white/10 rounded shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-2.5 w-2.5 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(shift);
              }}
            >
              <Pencil className="h-3 w-3 mr-2 text-orange-500" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCustomizeHours(shift);
              }}
            >
              <Clock className="h-3 w-3 mr-2 text-blue-500" />
              Personnaliser horaires
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCopy(shift);
              }}
            >
              <Copy className="h-3 w-3 mr-2" />
              Copier
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(shift.id);
              }}
              className="text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-2 text-red-600" />
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
        className="absolute bottom-1 right-1 h-6 w-6 p-0 rounded bg-white/15 hover:bg-white/30 text-white shrink-0 z-10"
        title="Modifier le shift"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(shift);
        }}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}
