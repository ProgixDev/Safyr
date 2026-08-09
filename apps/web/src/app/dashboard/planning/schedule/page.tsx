"use client";

import React, { useState, useMemo, useRef } from "react";
import { usePlanningSettingsStore } from "@/lib/stores/planningSettingsStore";
import type { PlanningSettings } from "@/lib/stores/planningSettingsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Users,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clipboard,
  X,
  Ban,
  Moon,
  AlertCircle,
  Clock,
  Scissors,
  PanelRightOpen,
  Filter as FilterIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/stores/uiStore";
import { PlanningSidebar } from "./_components/PlanningSidebar";

import type {
  StandardShift,
  AgentShift,
  SiteAgentAssignment,
  TimeOffRequest,
} from "@/lib/types";

import { mockClients, mockSites, mockPostes } from "@/data/sites";
import { BREAK_DURATION_OPTIONS } from "@/lib/planning-constants";
import { getSiteColorClasses } from "@/lib/site-colors";
import {
  mockStandardShifts,
  mockSiteAgentAssignments,
  mockAgentShifts,
} from "@/data/site-shifts";
import { mockTimeOffRequests } from "@/data/time-off";
import { usePlanningAgents } from "@/hooks/planning";
import { playAlertBeep } from "@/lib/audio-alerts";
import { DailyView } from "./_components/DailyView";
import { WeeklyView } from "./_components/WeeklyView";
import { MonthlyView } from "./_components/MonthlyView";
import { HourDetailsSection } from "./_components/HourDetailsSection";
import { FilterBar } from "./_components/FilterBar";
import {
  inferPosteWindow,
  countPosteCoverage,
  getPosteRequirementForDay,
} from "./_components/besoin-utils";
import type { Poste } from "@/lib/types";
import type {
  ViewType,
  DateConflict,
  PendingPasteAction,
  ShiftContext,
} from "./_components/types";

declare global {
  interface Window {
    __shiftContext?: ShiftContext;
  }
}

export default function SchedulePage() {
  return <ScheduleView />;
}

export function ScheduleView({
  forceSimulation = false,
}: {
  forceSimulation?: boolean;
}) {
  const { settings } = usePlanningSettingsStore();
  // Agents du planning = dossiers salariés du module RH (plus de liste figée).
  const { agents: planningAgents } = usePlanningAgents();
  const idCounterRef = React.useRef(0);
  const generateShiftId = () => {
    idCounterRef.current += 1;
    return `shift-popover-${idCounterRef.current}`;
  };

  // Multi-site filter state (empty array = all active)
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const scheduleSidebarOpen = useUiStore((s) => s.scheduleSidebarOpen);
  const setScheduleSidebarOpen = useUiStore((s) => s.setScheduleSidebarOpen);
  const activeFilterCount =
    selectedClientIds.length + selectedSiteIds.length + selectedAgentIds.length;

  // Active site context for handler operations — set by view interactions,
  // read synchronously by handlers (ref avoids closure staleness)
  const activeSiteIdRef = useRef<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("weekly");

  // Collapsed site groups (per-session only)
  const [collapsedSiteIds, setCollapsedSiteIds] = useState<string[]>([]);

  // Live data state (persisted across simulation on/off)
  const [liveStandardShifts, setLiveStandardShifts] =
    useState<StandardShift[]>(mockStandardShifts);
  const [liveSiteAgents, setLiveSiteAgents] = useState<SiteAgentAssignment[]>(
    mockSiteAgentAssignments,
  );
  const [liveAgentShifts, setLiveAgentShifts] =
    useState<AgentShift[]>(mockAgentShifts);

  // Simulation mode — writes go to shadow state instead of live
  const simulationMode = forceSimulation;
  const [simStandardShifts, setSimStandardShifts] = useState<
    StandardShift[] | null
  >(null);
  const [simSiteAgents, setSimSiteAgents] = useState<
    SiteAgentAssignment[] | null
  >(null);
  const [simAgentShifts, setSimAgentShifts] = useState<AgentShift[] | null>(
    null,
  );
  // Effective reads (simulation shadow if in sim mode + shadow initialized)
  const standardShifts =
    simulationMode && simStandardShifts !== null
      ? simStandardShifts
      : liveStandardShifts;
  const siteAgents =
    simulationMode && simSiteAgents !== null ? simSiteAgents : liveSiteAgents;
  const agentShifts =
    simulationMode && simAgentShifts !== null
      ? simAgentShifts
      : liveAgentShifts;

  // Effective writes — in sim mode, updates go to shadow (lazy-init from live)
  const setStandardShifts: React.Dispatch<
    React.SetStateAction<StandardShift[]>
  > = (v) => {
    if (simulationMode) {
      setSimStandardShifts((prev) => {
        const current = prev ?? liveStandardShifts;
        return typeof v === "function"
          ? (v as (x: StandardShift[]) => StandardShift[])(current)
          : v;
      });
    } else {
      setLiveStandardShifts(v);
    }
  };
  const setSiteAgents: React.Dispatch<
    React.SetStateAction<SiteAgentAssignment[]>
  > = (v) => {
    if (simulationMode) {
      setSimSiteAgents((prev) => {
        const current = prev ?? liveSiteAgents;
        return typeof v === "function"
          ? (v as (x: SiteAgentAssignment[]) => SiteAgentAssignment[])(current)
          : v;
      });
    } else {
      setLiveSiteAgents(v);
    }
  };
  const setAgentShifts: React.Dispatch<React.SetStateAction<AgentShift[]>> = (
    v,
  ) => {
    if (simulationMode) {
      setSimAgentShifts((prev) => {
        const current = prev ?? liveAgentShifts;
        return typeof v === "function"
          ? (v as (x: AgentShift[]) => AgentShift[])(current)
          : v;
      });
    } else {
      setLiveAgentShifts(v);
    }
  };

  // Modals
  const [showAgentCommand, setShowAgentCommand] = useState(false);
  const [agentsToAssign, setAgentsToAssign] = useState<string[]>([]);
  const [assignSiteId, setAssignSiteId] = useState<string>("");
  const [assignSearch, setAssignSearch] = useState("");
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showRemoveAgentModal, setShowRemoveAgentModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showTemplatePopover, setShowTemplatePopover] = useState(false);
  const [templatePopoverContext, setTemplatePopoverContext] = useState<{
    agentId: string;
    date: string;
  } | null>(null);
  const [selectedPopoverTemplateId, setSelectedPopoverTemplateId] = useState<
    string | null
  >(null);

  // Modal data
  const [editingShift, setEditingShift] = useState<AgentShift | null>(null);
  const [selectedAgentForRemoval, setSelectedAgentForRemoval] = useState<
    string | null
  >(null);
  const [conflictDetails, setConflictDetails] = useState<{
    agentId: string;
    date: string;
    conflict: DateConflict;
  } | null>(null);

  // Past date warning state
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);
  const [pastDateWarningCtx, setPastDateWarningCtx] = useState<{
    agentId: string;
    date: string;
  } | null>(null);
  const [pastDateAction, setPastDateAction] = useState<"create" | "paste">(
    "create",
  );

  // Copy/paste state
  const [copiedShift, setCopiedShift] = useState<AgentShift | null>(null);
  const [copiedWeekDates, setCopiedWeekDates] = useState<string[] | null>(null);
  const [copiedWeekAgentId, setCopiedWeekAgentId] = useState<string | null>(
    null,
  );
  const [pendingPasteAction, setPendingPasteAction] =
    useState<PendingPasteAction | null>(null);

  // Form state for shift creation/editing
  const [shiftForm, setShiftForm] = useState({
    shiftType: "standard" as "standard" | "on_demand",
    standardShiftId: "",
    startTime: "08:00",
    endTime: "16:00",
    breakDuration: 30,
    color: "#3b82f6",
    notes: "",
    isOvernight: false,
    // Split shift support
    isSplit: false,
    splitStartTime2: "14:00",
    splitEndTime2: "18:00",
    splitBreakDuration: 60,
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    startTime: "08:00",
    endTime: "16:00",
    breakDuration: 30,
    color: "#3b82f6",
  });

  // Visible sites = active sites, narrowed by client/site filters
  const visibleSites = useMemo(() => {
    const activeSites = mockSites.filter((s) => s.status === "active");
    return activeSites.filter((s) => {
      if (
        selectedClientIds.length > 0 &&
        !selectedClientIds.includes(s.clientId)
      )
        return false;
      if (selectedSiteIds.length > 0 && !selectedSiteIds.includes(s.id))
        return false;
      return true;
    });
  }, [selectedClientIds, selectedSiteIds]);

  // Agents per site: union of assigned + explicitly selected (per filter edge case)
  const agentsBySite = useMemo(() => {
    const map = new Map<string, { agentId: string; agentName: string }[]>();
    visibleSites.forEach((site) => {
      const assignedForSite = siteAgents
        .filter((sa) => sa.siteId === site.id && sa.active)
        .map((sa) => ({ agentId: sa.agentId, agentName: sa.agentName }));

      const assignedIds = new Set(assignedForSite.map((a) => a.agentId));
      const filtered =
        selectedAgentIds.length > 0
          ? assignedForSite.filter((a) => selectedAgentIds.includes(a.agentId))
          : assignedForSite;

      // Add explicitly selected agents not already assigned to this site
      // so user can see empty row and assign directly
      const extras =
        selectedAgentIds.length > 0
          ? selectedAgentIds
              .filter((id) => !assignedIds.has(id))
              .map((id) => {
                const a = planningAgents.find((p) => p.id === id);
                return a ? { agentId: a.id, agentName: a.name } : null;
              })
              .filter(
                (x): x is { agentId: string; agentName: string } => x !== null,
              )
          : [];

      map.set(site.id, [...filtered, ...extras]);
    });
    return map;
  }, [visibleSites, siteAgents, selectedAgentIds, planningAgents]);

  // Helper: templates for a specific site
  const getSiteStandardShifts = (siteId: string | null) =>
    siteId ? standardShifts.filter((s) => s.siteId === siteId) : [];

  // Helper: assigned agents for a specific site (includes agent data)
  const getAssignedAgentsForSite = (siteId: string | null) => {
    if (!siteId) return [];
    return siteAgents
      .filter((sa) => sa.siteId === siteId && sa.active)
      .map((sa) => {
        const agent = planningAgents.find((a) => a.id === sa.agentId);
        return { ...sa, agent };
      });
  };

  // Available agents (not yet assigned to the active site)
  const getAvailableAgentsForSite = (siteId: string | null) => {
    const assigned = getAssignedAgentsForSite(siteId);
    const assignedIds = assigned.map((a) => a.agentId);
    return planningAgents.filter((a) => !assignedIds.includes(a.id));
  };

  // Calculate display dates
  const displayDates = useMemo(() => {
    const dates: Date[] = [];
    if (viewType === "daily") {
      dates.push(new Date(currentDate));
    } else if (viewType === "weekly") {
      const start = new Date(currentDate);
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
      }
    } else if (viewType === "monthly") {
      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    }
    return dates;
  }, [currentDate, viewType]);

  // Helper functions
  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const isDateInPast = (date: Date | string): boolean => {
    const checkDate = typeof date === "string" ? new Date(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isClosedDay = (date: Date | string): boolean => {
    const d = typeof date === "string" ? new Date(date) : date;
    const dayIndex = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dayMap: (keyof PlanningSettings["openDays"])[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return !settings.openDays[dayMap[dayIndex]];
  };

  const isPublicHoliday = (date: Date | string): boolean => {
    const d = typeof date === "string" ? new Date(date) : date;
    const month = d.getMonth() + 1; // 1-indexed
    const day = d.getDate();
    const ph = settings.publicHolidays;

    if (ph.newYear && month === 1 && day === 1) return true;
    if (ph.laborDay && month === 5 && day === 1) return true;
    if (ph.victoryDay && month === 5 && day === 8) return true;
    if (ph.nationalDay && month === 7 && day === 14) return true;
    if (ph.assumption && month === 8 && day === 15) return true;
    if (ph.allSaints && month === 11 && day === 1) return true;
    if (ph.armistice && month === 11 && day === 11) return true;
    if (ph.christmas && month === 12 && day === 25) return true;

    // Variable dates — approximate via year
    const year = d.getFullYear();
    if (ph.easterMonday) {
      const easter = getEasterDate(year);
      const easterMonday = new Date(easter);
      easterMonday.setDate(easter.getDate() + 1);
      if (
        month === easterMonday.getMonth() + 1 &&
        day === easterMonday.getDate()
      )
        return true;
    }
    if (ph.ascension) {
      const easter = getEasterDate(year);
      const ascension = new Date(easter);
      ascension.setDate(easter.getDate() + 39);
      if (month === ascension.getMonth() + 1 && day === ascension.getDate())
        return true;
    }

    return false;
  };

  // Anonymous Gregorian algorithm for Easter
  const getEasterDate = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  };

  const isShiftInPast = (shift: AgentShift): boolean => {
    return isDateInPast(shift.date);
  };

  const isOvernightShift = (startTime: string, endTime: string): boolean => {
    const [startHour] = startTime.split(":").map(Number);
    const [endHour] = endTime.split(":").map(Number);
    return endHour < startHour || (endHour === startHour && endHour < 12);
  };

  const calculateShiftLength = (
    startTime: string,
    endTime: string,
    breakDuration: number,
  ): string => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let minutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    if (minutes < 0) {
      minutes += 24 * 60; // overnight
    }
    minutes -= breakDuration;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, "0") : ""}`;
  };

  // Sum of worked hours for an agent across all their shifts on the given
  // dates (any site). Counts split-shift second segments too.
  const calculateAgentHours = (agentId: string, dates: Date[]): number => {
    const visible = new Set(dates.map((d) => formatDate(d)));
    let totalMinutes = 0;
    for (const s of agentShifts) {
      if (s.agentId !== agentId) continue;
      if (!visible.has(s.date)) continue;
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      let mins = eh * 60 + em - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60;
      mins -= s.breakDuration;
      totalMinutes += Math.max(0, mins);

      if (s.isSplit && s.splitStartTime2 && s.splitEndTime2) {
        const [s2h, s2m] = s.splitStartTime2.split(":").map(Number);
        const [e2h, e2m] = s.splitEndTime2.split(":").map(Number);
        let mins2 = e2h * 60 + e2m - (s2h * 60 + s2m);
        if (mins2 < 0) mins2 += 24 * 60;
        mins2 -= s.splitBreakDuration ?? 0;
        totalMinutes += Math.max(0, mins2);
      }
    }
    return totalMinutes / 60;
  };

  const hasTimeOff = (agentId: string, date: string): boolean => {
    const dateObj = new Date(date);
    return mockTimeOffRequests.some((req) => {
      if (req.employeeId !== agentId || req.status !== "approved") return false;
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      dateObj.setHours(12, 0, 0, 0);
      return dateObj >= start && dateObj <= end;
    });
  };

  const hasShiftAtOtherSite = (
    agentId: string,
    date: string,
    currentSiteId: string,
  ): boolean => {
    return agentShifts.some(
      (s) =>
        s.agentId === agentId && s.date === date && s.siteId !== currentSiteId,
    );
  };

  const getDateConflict = (
    agentId: string,
    date: string,
  ): DateConflict | null => {
    if (isPublicHoliday(date)) {
      return {
        type: "time_off",
        severity: "medium",
        message: "Jour férié",
        details: undefined,
      };
    }
    if (hasTimeOff(agentId, date)) {
      const timeOff = mockTimeOffRequests.find((req) => {
        if (req.employeeId !== agentId || req.status !== "approved")
          return false;
        const dateObj = new Date(date);
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        dateObj.setHours(12, 0, 0, 0);
        return dateObj >= start && dateObj <= end;
      });
      return {
        type: "time_off",
        severity: "high",
        message: "Agent en congé",
        details: timeOff,
      };
    }
    if (
      activeSiteIdRef.current &&
      hasShiftAtOtherSite(agentId, date, activeSiteIdRef.current)
    ) {
      const otherShift = agentShifts.find(
        (s) =>
          s.agentId === agentId &&
          s.date === date &&
          s.siteId !== activeSiteIdRef.current,
      );
      return {
        type: "double_booking",
        severity: "medium",
        message: "Assigné sur un autre site",
        details: otherShift,
      };
    }
    return null;
  };

  const getOvernightShiftForDate = (
    agentId: string,
    date: string,
  ): AgentShift | null => {
    const dateObj = new Date(date);
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = formatDate(prevDate);

    const shift = agentShifts.find(
      (s) =>
        s.agentId === agentId &&
        s.date === prevDateStr &&
        s.siteId === activeSiteIdRef.current &&
        isOvernightShift(s.startTime, s.endTime),
    );
    return shift || null;
  };

  // Navigation
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewType === "daily") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewType === "weekly") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (viewType === "monthly") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // Agent management
  const handleBulkAssignAgents = () => {
    const siteId = activeSiteIdRef.current;
    if (!siteId || agentsToAssign.length === 0) return;

    const now = new Date();
    const newAssignments: SiteAgentAssignment[] = agentsToAssign
      .map((agentId, idx) => {
        const agent = planningAgents.find((a) => a.id === agentId);
        if (!agent) return null;
        return {
          id: `sa-${now.getTime()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          siteId,
          agentId,
          agentName: agent.name,
          assignedAt: now,
          active: true,
        };
      })
      .filter((x): x is SiteAgentAssignment => x !== null);

    setSiteAgents([...siteAgents, ...newAssignments]);
    setAgentsToAssign([]);
    setAssignSearch("");
    setShowAgentCommand(false);
  };

  const toggleAgentToAssign = (agentId: string) => {
    setAgentsToAssign((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId],
    );
  };

  const handleRemoveAgent = (agentId: string) => {
    setSelectedAgentForRemoval(agentId);
    setShowRemoveAgentModal(true);
  };

  const confirmRemoveAgent = () => {
    if (!selectedAgentForRemoval || !activeSiteIdRef.current) return;
    setSiteAgents(
      siteAgents.map((sa) =>
        sa.siteId === activeSiteIdRef.current &&
        sa.agentId === selectedAgentForRemoval
          ? { ...sa, active: false }
          : sa,
      ),
    );
    setAgentShifts(
      agentShifts.filter(
        (s) =>
          !(
            s.siteId === activeSiteIdRef.current &&
            s.agentId === selectedAgentForRemoval
          ),
      ),
    );
    setShowRemoveAgentModal(false);
    setSelectedAgentForRemoval(null);
  };

  // Shift management
  const handleCreateShift = (agentId: string, date: string) => {
    if (isDateInPast(date)) {
      playAlertBeep();
      setPastDateAction("create");
      setPastDateWarningCtx({ agentId, date });
      setShowPastDateWarning(true);
      return;
    }
    const conflict = getDateConflict(agentId, date);
    if (conflict?.type === "time_off") return;

    if (conflict?.type === "double_booking") {
      setPendingPasteAction({ type: "shift", agentId, dates: [date] });
      setShowOverrideModal(true);
      return;
    }

    setEditingShift(null);
    setShiftForm({
      shiftType: "standard",
      standardShiftId:
        getSiteStandardShifts(activeSiteIdRef.current)[0]?.id || "",
      startTime: "08:00",
      endTime: "16:00",
      breakDuration: 30,
      color: "#3b82f6",
      notes: "",
      isOvernight: false,
      isSplit: false,
      splitStartTime2: "14:00",
      splitEndTime2: "18:00",
      splitBreakDuration: 60,
    });

    // Open compact template popover instead of full modal
    setTemplatePopoverContext({ agentId, date });
    setSelectedPopoverTemplateId(
      getSiteStandardShifts(activeSiteIdRef.current)[0]?.id ?? null,
    );
    setShowTemplatePopover(true);

    // Store context for creation
    window.__shiftContext = { agentId, date };
  };

  const handleEditShift = (shift: AgentShift) => {
    setEditingShift(shift);

    // Calculate split start time based on first shift end + break
    const calcSplitStart = (endTime: string, breakDuration: number) => {
      const [endH, endM] = endTime.split(":").map(Number);
      let start2Mins = endH * 60 + endM + breakDuration;
      if (start2Mins >= 24 * 60) start2Mins -= 24 * 60;
      const start2H = Math.floor(start2Mins / 60);
      const start2M = start2Mins % 60;
      return `${start2H.toString().padStart(2, "0")}:${start2M.toString().padStart(2, "0")}`;
    };

    const isSplit = shift.isSplit || false;
    const splitBreakDuration = shift.splitBreakDuration || 60;

    setShiftForm({
      shiftType: shift.shiftType,
      standardShiftId: shift.standardShiftId || "",
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      color: shift.color || "#3b82f6",
      notes: shift.notes || "",
      isOvernight: isOvernightShift(shift.startTime, shift.endTime),
      isSplit,
      splitStartTime2: isSplit
        ? shift.splitStartTime2 ||
          calcSplitStart(shift.endTime, splitBreakDuration)
        : "14:00",
      splitEndTime2: shift.splitEndTime2 || "18:00",
      splitBreakDuration,
    });
    setShowShiftModal(true);
  };

  // Opens edit modal forced to Personnalisé tab for inline hour customization (PG5)
  const handleCustomizeShiftHours = (shift: AgentShift) => {
    setEditingShift(shift);
    setShiftForm({
      shiftType: "on_demand",
      standardShiftId: shift.standardShiftId || "",
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      color: shift.color || "#3b82f6",
      notes: shift.notes || "",
      isOvernight: isOvernightShift(shift.startTime, shift.endTime),
      isSplit: shift.isSplit || false,
      splitStartTime2: shift.splitStartTime2 || "14:00",
      splitEndTime2: shift.splitEndTime2 || "18:00",
      splitBreakDuration: shift.splitBreakDuration || 60,
    });
    setShowShiftModal(true);
  };

  const handleDeleteShift = (shiftId: string) => {
    setAgentShifts(agentShifts.filter((s) => s.id !== shiftId));
  };

  const handleSelectTemplateFromPopover = (templateId: string) => {
    const template = getSiteStandardShifts(activeSiteIdRef.current).find(
      (t) => t.id === templateId,
    );
    if (!template || !templatePopoverContext) return;

    const { agentId, date } = templatePopoverContext;
    const newShift: AgentShift = {
      id: generateShiftId(),
      agentId,
      siteId: activeSiteIdRef.current!,
      date,
      shiftType: "standard",
      standardShiftId: templateId,
      startTime: template.startTime,
      endTime: template.endTime,
      breakDuration: template.breakDuration,
      color: template.color,
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAgentShifts((prev) => [...prev, newShift]);
    setShowTemplatePopover(false);
    setTemplatePopoverContext(null);
    setSelectedPopoverTemplateId(null);
  };

  const handleSelectPosteFromPopover = (poste: Poste) => {
    if (!templatePopoverContext || !activeSiteIdRef.current) return;

    const win = inferPosteWindow(poste);
    const { agentId, date } = templatePopoverContext;

    // Reuse matching template color when available, otherwise fall back
    const matchingTemplate = getSiteStandardShifts(
      activeSiteIdRef.current,
    ).find((t) => t.startTime === win.start && t.endTime === win.end);

    const newShift: AgentShift = {
      id: generateShiftId(),
      agentId,
      siteId: activeSiteIdRef.current,
      date,
      shiftType: matchingTemplate ? "standard" : "on_demand",
      standardShiftId: matchingTemplate?.id,
      startTime: win.start,
      endTime: win.end,
      breakDuration:
        poste.schedule.breakDuration ?? matchingTemplate?.breakDuration ?? 30,
      color: matchingTemplate?.color ?? "#3b82f6",
      notes: poste.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAgentShifts((prev) => [...prev, newShift]);
    setShowTemplatePopover(false);
    setTemplatePopoverContext(null);
    setSelectedPopoverTemplateId(null);
  };

  const handleOpenCustomShiftFromPopover = () => {
    if (!templatePopoverContext) return;
    const { agentId, date } = templatePopoverContext;
    window.__shiftContext = { agentId, date };

    const baseTemplate = selectedPopoverTemplateId
      ? getSiteStandardShifts(activeSiteIdRef.current).find(
          (t) => t.id === selectedPopoverTemplateId,
        )
      : null;

    setShowTemplatePopover(false);
    setSelectedPopoverTemplateId(null);
    setShiftForm({
      shiftType: "on_demand",
      standardShiftId: "",
      startTime: baseTemplate?.startTime ?? "08:00",
      endTime: baseTemplate?.endTime ?? "16:00",
      breakDuration: baseTemplate?.breakDuration ?? 30,
      color: baseTemplate?.color ?? "#3b82f6",
      notes: "",
      isOvernight: false,
      isSplit: false,
      splitStartTime2: "14:00",
      splitEndTime2: "18:00",
      splitBreakDuration: 60,
    });
    setShowShiftModal(true);
  };

  const handleSaveShift = () => {
    if (editingShift) {
      // Update existing shift
      const updatedShift: AgentShift = {
        ...editingShift,
        shiftType: shiftForm.shiftType,
        standardShiftId:
          shiftForm.shiftType === "standard"
            ? shiftForm.standardShiftId
            : undefined,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        breakDuration: shiftForm.breakDuration,
        color: shiftForm.color,
        notes: shiftForm.notes,
        isSplit: shiftForm.isSplit,
        splitStartTime2: shiftForm.isSplit
          ? shiftForm.splitStartTime2
          : undefined,
        splitEndTime2: shiftForm.isSplit ? shiftForm.splitEndTime2 : undefined,
        splitBreakDuration: shiftForm.isSplit
          ? shiftForm.splitBreakDuration
          : undefined,
        updatedAt: new Date(),
      };
      setAgentShifts(
        agentShifts.map((s) => (s.id === editingShift.id ? updatedShift : s)),
      );
    } else {
      // Create new shift
      const context = window.__shiftContext;
      if (!context || !activeSiteIdRef.current) return;

      let startTime = shiftForm.startTime;
      let endTime = shiftForm.endTime;
      let color = shiftForm.color;

      if (shiftForm.shiftType === "standard") {
        const template = getSiteStandardShifts(activeSiteIdRef.current).find(
          (t) => t.id === shiftForm.standardShiftId,
        );
        if (template) {
          startTime = template.startTime;
          endTime = template.endTime;
          color = template.color;
        }
      }

      const newShift: AgentShift = {
        id: `shift-${Date.now()}`,
        agentId: context.agentId,
        siteId: activeSiteIdRef.current,
        date: context.date,
        shiftType: shiftForm.shiftType,
        standardShiftId:
          shiftForm.shiftType === "standard"
            ? shiftForm.standardShiftId
            : undefined,
        startTime,
        endTime,
        breakDuration: shiftForm.breakDuration,
        color,
        notes: shiftForm.notes,
        isSplit: shiftForm.isSplit,
        splitStartTime2: shiftForm.isSplit
          ? shiftForm.splitStartTime2
          : undefined,
        splitEndTime2: shiftForm.isSplit ? shiftForm.splitEndTime2 : undefined,
        splitBreakDuration: shiftForm.isSplit
          ? shiftForm.splitBreakDuration
          : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setAgentShifts([...agentShifts, newShift]);
    }
    setShowShiftModal(false);
    setEditingShift(null);
  };

  const handleSaveAsTemplate = () => {
    if (!activeSiteIdRef.current) return;
    const newTemplate: StandardShift = {
      id: `std-${Date.now()}`,
      siteId: activeSiteIdRef.current,
      name: templateForm.name,
      startTime: templateForm.startTime,
      endTime: templateForm.endTime,
      breakDuration: templateForm.breakDuration,
      color: templateForm.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setStandardShifts([...standardShifts, newTemplate]);
    setShowTemplateModal(false);
    setTemplateForm({
      name: "",
      startTime: "08:00",
      endTime: "16:00",
      breakDuration: 30,
      color: "#3b82f6",
    });
  };

  // Copy/paste
  const handleCopyShift = (shift: AgentShift) => {
    setCopiedShift(shift);
    setCopiedWeekDates(null);
    setCopiedWeekAgentId(null);
  };

  const handlePasteShift = (
    agentId: string,
    date: string,
    forceOverride: boolean = false,
  ) => {
    if (!copiedShift) return;
    if (isDateInPast(date)) {
      playAlertBeep();
      setPastDateAction("paste");
      setPastDateWarningCtx({ agentId, date });
      setShowPastDateWarning(true);
      return;
    }

    const conflict = getDateConflict(agentId, date);
    if (conflict?.type === "time_off") return;

    if (conflict?.type === "double_booking" && !forceOverride) {
      setPendingPasteAction({ type: "shift", agentId, dates: [date] });
      setShowOverrideModal(true);
      return;
    }

    const existingShift = agentShifts.find(
      (s) =>
        s.agentId === agentId &&
        s.date === date &&
        s.siteId === activeSiteIdRef.current,
    );
    if (existingShift) {
      setAgentShifts(agentShifts.filter((s) => s.id !== existingShift.id));
    }

    const newShift: AgentShift = {
      ...copiedShift,
      id: `shift-${Date.now()}-${Math.random()}`,
      agentId,
      date,
      siteId: activeSiteIdRef.current!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAgentShifts([...agentShifts, newShift]);
  };

  const handleCopyWeek = (agentId: string, dates: string[]) => {
    setCopiedWeekDates(dates);
    setCopiedWeekAgentId(agentId);
    setCopiedShift(null);
  };

  const handlePasteWeekForAgent = (
    agentId: string,
    targetDates: string[],
    forceOverride: boolean = false,
  ) => {
    if (!copiedWeekDates || !copiedWeekAgentId || !activeSiteIdRef.current)
      return;

    // Check if agent's week is empty
    const hasExistingShifts = targetDates.some((date) => {
      if (isDateInPast(date)) return false;
      return agentShifts.some(
        (s) =>
          s.agentId === agentId &&
          s.date === date &&
          s.siteId === activeSiteIdRef.current,
      );
    });

    if (hasExistingShifts) return;

    // Check for time-off conflicts - these cannot be overridden
    const timeOffDates = targetDates.filter((date) => {
      if (isDateInPast(date)) return false;
      return hasTimeOff(agentId, date);
    });

    if (timeOffDates.length > 0) return;

    // Check for double booking conflicts
    const siteIdForCheck = activeSiteIdRef.current;
    const hasDoubleBooking = targetDates.some((date) => {
      if (isDateInPast(date)) return false;
      if (!siteIdForCheck) return false;
      return hasShiftAtOtherSite(agentId, date, siteIdForCheck);
    });

    if (hasDoubleBooking && !forceOverride) {
      setPendingPasteAction({ type: "week", agentId, dates: targetDates });
      setShowOverrideModal(true);
      return;
    }

    // Perform paste
    const sourceShifts = copiedWeekDates.map((date) =>
      agentShifts.find(
        (s) =>
          s.agentId === copiedWeekAgentId &&
          s.date === date &&
          s.siteId === activeSiteIdRef.current,
      ),
    );

    const newShifts: AgentShift[] = [];
    targetDates.forEach((targetDate, idx) => {
      if (isDateInPast(targetDate)) return;
      const sourceShift = sourceShifts[idx];
      if (!sourceShift) return;

      newShifts.push({
        ...sourceShift,
        id: `shift-${Date.now()}-${Math.random()}`,
        agentId,
        date: targetDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    setAgentShifts([...agentShifts, ...newShifts]);
  };

  const handleDeleteWeekForAgent = (agentId: string, dates: string[]) => {
    setAgentShifts(
      agentShifts.filter(
        (s) =>
          !(
            s.agentId === agentId &&
            dates.includes(s.date) &&
            s.siteId === activeSiteIdRef.current &&
            !isShiftInPast(s)
          ),
      ),
    );
  };

  const handleConflictClick = (agentId: string, date: string) => {
    const conflict = getDateConflict(agentId, date);
    if (conflict) {
      setConflictDetails({ agentId, date, conflict });
      setShowConflictModal(true);
    }
  };

  const handleRemoveConflictingShift = () => {
    if (!conflictDetails) return;
    const shift = agentShifts.find(
      (s) =>
        s.agentId === conflictDetails.agentId &&
        s.date === conflictDetails.date &&
        s.siteId === activeSiteIdRef.current,
    );
    if (shift) {
      handleDeleteShift(shift.id);
    }
    setShowConflictModal(false);
    setConflictDetails(null);
  };

  const handleOverrideConfirm = () => {
    if (!pendingPasteAction) return;

    if (pendingPasteAction.type === "shift") {
      handlePasteShift(
        pendingPasteAction.agentId,
        pendingPasteAction.dates[0],
        true,
      );
    } else if (pendingPasteAction.type === "week") {
      handlePasteWeekForAgent(
        pendingPasteAction.agentId,
        pendingPasteAction.dates,
        true,
      );
    }

    setPendingPasteAction(null);
    setShowOverrideModal(false);
  };

  // PDF Export — iterates over visible sites
  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const periodLabel =
      viewType === "monthly"
        ? currentDate.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })
        : `${displayDates[0]?.toLocaleDateString("fr-FR")} – ${displayDates[displayDates.length - 1]?.toLocaleDateString("fr-FR")}`;

    const dateLabels = displayDates.map((d) =>
      d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    );

    const buildShiftRows = (
      agents: { agentId: string; agentName: string }[],
      shifts: AgentShift[],
    ) =>
      agents.map((a) => {
        const row: (string | number)[] = [a.agentName];
        displayDates.forEach((date) => {
          const ds = date.toISOString().split("T")[0];
          const s = shifts.find(
            (sh) => sh.agentId === a.agentId && sh.date === ds,
          );
          row.push(s ? `${s.startTime}–${s.endTime}` : "");
        });
        return row;
      });

    const tableStyles = { fontSize: 7, cellPadding: 2 };
    const headStyles = { fillColor: [15, 23, 42] as [number, number, number] };

    doc.setFontSize(16);
    doc.text("Planning", 14, 16);
    doc.setFontSize(10);
    doc.text(periodLabel, 14, 23);

    let currentY = 30;
    visibleSites.forEach((site) => {
      doc.setFontSize(11);
      doc.text(`${site.clientName} — ${site.name}`, 14, currentY);
      currentY += 5;

      const siteShifts = agentShifts.filter((s) => s.siteId === site.id);
      const siteAgentsForPdf = agentsBySite.get(site.id) ?? [];
      const rows = buildShiftRows(siteAgentsForPdf, siteShifts);

      if (rows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [["Agent", ...dateLabels]],
          body: rows,
          styles: tableStyles,
          headStyles,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentY = ((doc as any).lastAutoTable?.finalY ?? currentY + 20) + 10;
      } else {
        currentY += 15;
      }
    });

    doc.save(`planning-${periodLabel.replace(/\s+/g, "-")}.pdf`);
  };

  // Aggregate agent list across visible sites (deduped by agentId)
  const visibleAgentsFlat = useMemo(() => {
    const seen = new Set<string>();
    const rows: { agentId: string; agentName: string }[] = [];
    agentsBySite.forEach((list) => {
      list.forEach((a) => {
        if (!seen.has(a.agentId)) {
          seen.add(a.agentId);
          rows.push(a);
        }
      });
    });
    return rows;
  }, [agentsBySite]);

  // All shifts across visible sites (used for per-agent contract summaries
  // and planning summary — responsive to filters)
  const shiftsAcrossVisibleSites = useMemo(
    () =>
      agentShifts.filter((s) => visibleSites.some((vs) => vs.id === s.siteId)),
    [agentShifts, visibleSites],
  );

  // Total planned hours across visible sites + dates (filter-scoped)
  const totalPlannedHours = useMemo(() => {
    const visibleDateSet = new Set(displayDates.map((d) => formatDate(d)));
    let total = 0;
    for (const s of shiftsAcrossVisibleSites) {
      if (!visibleDateSet.has(s.date)) continue;
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      let mins = eh * 60 + em - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60;
      mins -= s.breakDuration;
      total += Math.max(0, mins);
      if (s.isSplit && s.splitStartTime2 && s.splitEndTime2) {
        const [s2h, s2m] = s.splitStartTime2.split(":").map(Number);
        const [e2h, e2m] = s.splitEndTime2.split(":").map(Number);
        let mins2 = e2h * 60 + e2m - (s2h * 60 + s2m);
        if (mins2 < 0) mins2 += 24 * 60;
        mins2 -= s.splitBreakDuration ?? 0;
        total += Math.max(0, mins2);
      }
    }
    return total / 60;
  }, [shiftsAcrossVisibleSites, displayDates]);

  const planningSummary = useMemo(() => {
    const overtimeHours = Math.max(
      0,
      totalPlannedHours - visibleAgentsFlat.length * 35,
    );
    const mealCount = agentShifts.filter((s) => {
      if (!visibleSites.some((vs) => vs.id === s.siteId)) return false;
      const hoursStr = calculateShiftLength(
        s.startTime,
        s.endTime,
        s.breakDuration,
      );
      const hours = parseFloat(hoursStr.replace("h", ".")) || 0;
      const hours2Str = s.isSplit
        ? calculateShiftLength(
            s.splitStartTime2 || "00:00",
            s.splitEndTime2 || "00:00",
            0,
          )
        : "0";
      const hours2 = parseFloat(hours2Str.replace("h", ".")) || 0;
      return hours + hours2 > 6;
    }).length;
    const absenceCount = visibleAgentsFlat.filter(({ agentId }) =>
      displayDates.some((date) => hasTimeOff(agentId, formatDate(date))),
    ).length;

    // Category hour breakdown (H normale, H nuit, H dimanche, H férié)
    const visibleDateSet = new Set(displayDates.map((d) => formatDate(d)));
    const computeNightHours = (
      startTime: string,
      endTime: string,
      breakMins: number,
    ) => {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startMins = sh * 60 + sm;
      let endMins = eh * 60 + em;
      if (endMins <= startMins) endMins += 24 * 60;
      const dayStart = settings.dayHourStart * 60;
      const dayEnd = settings.dayHourEnd * 60;
      let nightMins = 0;
      if (startMins < dayStart)
        nightMins += Math.min(endMins, dayStart) - startMins;
      if (endMins > dayEnd) nightMins += endMins - Math.max(startMins, dayEnd);
      const totalMins = endMins - startMins;
      if (totalMins > 0 && breakMins > 0) {
        nightMins = Math.max(
          0,
          nightMins - breakMins * (nightMins / totalMins),
        );
      }
      return nightMins / 60;
    };

    let hoursNight = 0;
    let hoursSunday = 0;
    let hoursHoliday = 0;
    for (const s of shiftsAcrossVisibleSites) {
      if (!visibleDateSet.has(s.date)) continue;
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      let mins = eh * 60 + em - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60;
      mins -= s.breakDuration;
      const hrs = Math.max(0, mins / 60);
      const date = new Date(s.date + "T00:00:00");
      const isSunday = date.getDay() === 0;
      const isHoliday = isPublicHoliday(date);
      const nightHrs = computeNightHours(
        s.startTime,
        s.endTime,
        s.breakDuration,
      );
      hoursNight += nightHrs;
      if (isSunday) hoursSunday += hrs;
      if (isHoliday) hoursHoliday += hrs;
      if (s.isSplit && s.splitStartTime2 && s.splitEndTime2) {
        const [s2h, s2m] = s.splitStartTime2.split(":").map(Number);
        const [e2h, e2m] = s.splitEndTime2.split(":").map(Number);
        let mins2 = e2h * 60 + e2m - (s2h * 60 + s2m);
        if (mins2 < 0) mins2 += 24 * 60;
        const hrs2 = Math.max(0, mins2 / 60);
        const nightHrs2 = computeNightHours(
          s.splitStartTime2,
          s.splitEndTime2,
          0,
        );
        hoursNight += nightHrs2;
        if (isSunday) hoursSunday += hrs2;
        if (isHoliday) hoursHoliday += hrs2;
      }
    }
    const hoursNormal = Math.max(
      0,
      totalPlannedHours - hoursNight - hoursSunday - hoursHoliday,
    );

    return {
      totalHours: totalPlannedHours,
      overtimeHours,
      mealCount,
      absenceCount,
      hoursNormal,
      hoursNight,
      hoursSunday,
      hoursHoliday,
    };
  }, [
    totalPlannedHours,
    visibleAgentsFlat,
    visibleSites,
    agentShifts,
    displayDates,
    shiftsAcrossVisibleSites,
    settings,
    isPublicHoliday,
  ]);

  const toggleSiteCollapse = (siteId: string) => {
    setCollapsedSiteIds((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId],
    );
  };

  // When clients change, prune any site whose client is no longer selected
  const handleChangeClients = (ids: string[]) => {
    setSelectedClientIds(ids);
    if (ids.length === 0) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds((prev) =>
        prev.filter((siteId) => {
          const s = mockSites.find((x) => x.id === siteId);
          return s ? ids.includes(s.clientId) : false;
        }),
      );
    }
  };

  // Compact period label for the sticky header
  const periodLabel =
    viewType === "monthly"
      ? currentDate.toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        })
      : viewType === "weekly"
        ? `Sem. du ${displayDates[0]?.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) ?? ""}`
        : currentDate.toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "numeric",
            month: "long",
          });

  return (
    <div>
      {/* Full-bleed sticky header — single row + optional banners */}
      <header
        className={cn(
          "sticky -top-6 -mx-6 z-40 bg-background/95 backdrop-blur-sm border-b",
          forceSimulation && "border-red-600",
        )}
      >
        <div className="flex items-center gap-6 px-8 py-4">
          <h1
            className={cn(
              "text-3xl font-bold leading-none shrink-0 tracking-tight",
              forceSimulation && "text-red-600",
            )}
          >
            {forceSimulation ? "Simulation" : "Planning"}
          </h1>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <FilterBar
              clients={mockClients}
              sites={mockSites.filter((s) => s.status === "active")}
              agents={planningAgents}
              selectedClientIds={selectedClientIds}
              selectedSiteIds={selectedSiteIds}
              selectedAgentIds={selectedAgentIds}
              onChangeClients={handleChangeClients}
              onChangeSites={setSelectedSiteIds}
              onChangeAgents={setSelectedAgentIds}
              variant="pill"
            />
          </div>
          <button
            type="button"
            onClick={() => setScheduleSidebarOpen(!scheduleSidebarOpen)}
            className="shrink-0 inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-border/50 bg-background hover:bg-muted/60 transition"
            title={
              scheduleSidebarOpen
                ? "Masquer résumé & détails"
                : "Afficher résumé & détails"
            }
          >
            <PanelRightOpen className="h-4 w-4" />
            <FilterIcon className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Optional copy-mode banner row */}
        {(copiedShift || copiedWeekDates) && (
          <div className="relative flex items-center gap-3 px-6 py-3 bg-red-600 border-t border-red-700 text-white shadow-sm">
            <Clipboard className="h-5 w-5 shrink-0 absolute left-6" />
            <span className="text-base font-bold tracking-wide flex-1 uppercase text-center">
              {copiedShift
                ? `Mode copie actif — ${copiedShift.startTime}–${copiedShift.endTime} · cliquez sur une cellule vide pour coller`
                : "Mode copie — semaine copiée · cliquez sur une ligne vide pour coller"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-sm font-semibold text-white hover:bg-red-700 absolute right-4"
              onClick={() => {
                setCopiedShift(null);
                setCopiedWeekDates(null);
                setCopiedWeekAgentId(null);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Désactiver
            </Button>
          </div>
        )}

        {/* Optional simulation banner row */}
        {simulationMode && (
          <div className="relative flex items-center gap-3 px-6 py-3 bg-red-600 border-t border-red-700 text-white shadow-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 absolute left-6" />
            <span className="text-base font-bold tracking-wide flex-1 uppercase text-center">
              Mode simulation actif — les modifications ne sont pas sauvegardées
            </span>
          </div>
        )}
      </header>

      {/* Right sidebar — résumé + détails */}
      {scheduleSidebarOpen && (
        <PlanningSidebar
          periodLabel={periodLabel}
          onPrev={() => navigateDate("prev")}
          onNext={() => navigateDate("next")}
          onToday={() => setCurrentDate(new Date())}
          viewType={viewType}
          onViewChange={setViewType}
          onExportPDF={handleExportPDF}
          summary={planningSummary}
          onClose={() => setScheduleSidebarOpen(false)}
        />
      )}

      {/* Content with its own padding */}
      <div
        className={`p-6 space-y-4 ${scheduleSidebarOpen ? "lg:pr-[22rem]" : ""}`}
      >
        {/* Global assign-agent action */}
        <div className="flex justify-end">
          <Button
            className="gap-2"
            onClick={() => {
              activeSiteIdRef.current = null;
              setAssignSiteId("");
              setAgentsToAssign([]);
              setAssignSearch("");
              setShowAgentCommand(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Affecter un agent
          </Button>
        </div>

        {/* Per-site schedule grid */}
        <div className="space-y-6">
          {visibleSites.map((site) => {
            const siteAgentsList = agentsBySite.get(site.id) ?? [];
            const siteShiftsList = agentShifts.filter(
              (s) => s.siteId === site.id,
            );
            const sitePostesList = mockPostes.filter(
              (p) => p.siteId === site.id,
            );
            const siteTotalNeeded = sitePostesList.reduce(
              (sum, p) => sum + (p.capacity?.minAgents ?? 0),
              0,
            );
            const colors = getSiteColorClasses(site.color);
            const collapsed = collapsedSiteIds.includes(site.id);

            // Handler wrappers that set the active-site context synchronously
            const withSite =
              <A extends unknown[]>(fn: (...args: A) => void) =>
              (...args: A) => {
                activeSiteIdRef.current = site.id;
                fn(...args);
              };

            return (
              <Card key={site.id} className="overflow-hidden">
                <div
                  className={`flex items-center justify-between px-4 py-2 ${colors.bg} text-white`}
                >
                  <button
                    onClick={() => toggleSiteCollapse(site.id)}
                    className="flex items-center gap-2 hover:opacity-90 min-w-0"
                  >
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 rotate-90 shrink-0" />
                    )}
                    <span className="text-base font-semibold truncate">
                      {site.name}
                    </span>
                    <span className="text-xs opacity-80 truncate">
                      {site.address.city}
                    </span>
                  </button>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="opacity-90">
                      {siteAgentsList.length} agent
                      {siteAgentsList.length > 1 ? "s" : ""}
                    </span>
                    {siteTotalNeeded > 0 && (
                      <span className="opacity-90">
                        Besoin {siteTotalNeeded}/jour
                      </span>
                    )}
                  </div>
                </div>
                {!collapsed && (
                  <CardContent className="pt-4">
                    {viewType === "daily" && (
                      <DailyView
                        date={displayDates[0]}
                        agents={siteAgentsList}
                        shifts={siteShiftsList}
                        allShifts={shiftsAcrossVisibleSites}
                        copiedShift={copiedShift}
                        onCreateShift={withSite(handleCreateShift)}
                        onEditShift={withSite(handleEditShift)}
                        onDeleteShift={withSite(handleDeleteShift)}
                        onCopyShift={withSite(handleCopyShift)}
                        onPasteShift={withSite(handlePasteShift)}
                        onConflictClick={withSite(handleConflictClick)}
                        getDateConflict={getDateConflict}
                        getOvernightShift={getOvernightShiftForDate}
                        calculateAgentHours={calculateAgentHours}
                        onRemoveAgent={withSite(handleRemoveAgent)}
                        onCustomizeShiftHours={withSite(
                          handleCustomizeShiftHours,
                        )}
                        isClosedDay={isClosedDay}
                        maxDailyWorkHours={settings.maxDailyWorkHours}
                        sitePostes={sitePostesList}
                        siteColor={site.color}
                      />
                    )}
                    {viewType === "weekly" && (
                      <WeeklyView
                        dates={displayDates}
                        agents={siteAgentsList}
                        shifts={siteShiftsList}
                        allShifts={shiftsAcrossVisibleSites}
                        copiedShift={copiedShift}
                        copiedWeekDates={copiedWeekDates}
                        copiedWeekAgentId={copiedWeekAgentId}
                        onCreateShift={withSite(handleCreateShift)}
                        onEditShift={withSite(handleEditShift)}
                        onDeleteShift={withSite(handleDeleteShift)}
                        onCopyShift={withSite(handleCopyShift)}
                        onPasteShift={withSite(handlePasteShift)}
                        onCopyWeek={withSite(handleCopyWeek)}
                        onPasteWeek={withSite(handlePasteWeekForAgent)}
                        onDeleteWeek={withSite(handleDeleteWeekForAgent)}
                        onConflictClick={withSite(handleConflictClick)}
                        getDateConflict={getDateConflict}
                        onCustomizeShiftHours={withSite(
                          handleCustomizeShiftHours,
                        )}
                        isClosedDay={isClosedDay}
                        selectedSiteId={site.id}
                        siteColor={site.color}
                      />
                    )}
                    {viewType === "monthly" && (
                      <MonthlyView
                        dates={displayDates}
                        agents={siteAgentsList}
                        shifts={siteShiftsList}
                        allShifts={shiftsAcrossVisibleSites}
                        copiedShift={copiedShift}
                        onCreateShift={withSite(handleCreateShift)}
                        onEditShift={withSite(handleEditShift)}
                        onPasteShift={withSite(handlePasteShift)}
                        isClosedDay={isClosedDay}
                        siteColor={site.color}
                        sitePostes={sitePostesList}
                      />
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
          {visibleSites.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Aucun site ne correspond aux filtres sélectionnés.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Week navigator — scroll month's weeks (weekly view only) */}
        {viewType === "weekly" &&
          (() => {
            const firstOfMonth = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              1,
            );
            const lastOfMonth = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              0,
            );
            // Start from Monday of week containing first-of-month
            const weekStarts: Date[] = [];
            const cursor = new Date(firstOfMonth);
            const day = cursor.getDay();
            const diffToMon = day === 0 ? -6 : 1 - day;
            cursor.setDate(cursor.getDate() + diffToMon);
            while (cursor <= lastOfMonth) {
              weekStarts.push(new Date(cursor));
              cursor.setDate(cursor.getDate() + 7);
            }
            const activeMon = new Date(currentDate);
            const adjDay = activeMon.getDay();
            activeMon.setDate(
              activeMon.getDate() + (adjDay === 0 ? -6 : 1 - adjDay),
            );
            const activeKey = activeMon.toISOString().split("T")[0];
            return (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-2">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 shrink-0">
                    Semaines de{" "}
                    {firstOfMonth.toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex gap-1.5">
                    {weekStarts.map((ws) => {
                      const we = new Date(ws);
                      we.setDate(we.getDate() + 6);
                      const key = ws.toISOString().split("T")[0];
                      const isActive = key === activeKey;
                      const weekNum = (() => {
                        const d = new Date(
                          Date.UTC(
                            ws.getFullYear(),
                            ws.getMonth(),
                            ws.getDate(),
                          ),
                        );
                        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                        const yearStart = new Date(
                          Date.UTC(d.getUTCFullYear(), 0, 1),
                        );
                        return Math.ceil(
                          ((d.getTime() - yearStart.getTime()) / 86400000 + 1) /
                            7,
                        );
                      })();
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCurrentDate(new Date(ws))}
                          className={`shrink-0 flex flex-col items-center gap-0.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background border-border hover:border-primary/40"
                          }`}
                        >
                          <span className="font-bold">
                            S{String(weekNum).padStart(2, "0")}
                          </span>
                          <span
                            className={`text-[10px] ${isActive ? "opacity-90" : "text-muted-foreground"}`}
                          >
                            {ws.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                            {" – "}
                            {we.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Détail des majorations — bottom of page, filter-scoped */}
        <HourDetailsSection
          agents={visibleAgentsFlat}
          agentShifts={agentShifts.filter((s) =>
            visibleSites.some((vs) => vs.id === s.siteId),
          )}
          displayDates={displayDates}
          isPublicHoliday={isPublicHoliday}
          timeOffRequests={mockTimeOffRequests}
          settings={settings}
        />

        {/* Compact Shift Template Popover */}
        <Dialog
          open={showTemplatePopover}
          onOpenChange={setShowTemplatePopover}
        >
          <DialogContent className="max-w-xs p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Ajouter un Shift</DialogTitle>
            </DialogHeader>
            <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Ajouter un Shift</span>
            </div>
            <Tabs defaultValue="standard" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b h-9">
                <TabsTrigger value="standard" className="text-xs rounded-none">
                  Modèle
                </TabsTrigger>
                <TabsTrigger value="on_demand" className="text-xs rounded-none">
                  Personnalisé
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standard" className="m-0">
                {/* Weekday selector */}
                {templatePopoverContext &&
                  (() => {
                    const d = new Date(
                      templatePopoverContext.date + "T00:00:00",
                    );
                    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
                    const dayLabels = [
                      "Lu",
                      "Ma",
                      "Me",
                      "Je",
                      "Ve",
                      "Sa",
                      "Di",
                    ];
                    return (
                      <div className="flex justify-center gap-1 px-3 pt-3 pb-1">
                        {dayLabels.map((label, i) => (
                          <div
                            key={i}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                              i === dayIdx
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
                  {/* Postes à combler for this date */}
                  {templatePopoverContext &&
                    (() => {
                      const d = new Date(
                        templatePopoverContext.date + "T00:00:00",
                      );
                      const sitePostesForPopover = mockPostes.filter(
                        (p) => p.siteId === activeSiteIdRef.current,
                      );
                      const siteShiftsForDate = agentShifts.filter(
                        (s) =>
                          s.siteId === activeSiteIdRef.current &&
                          s.date === templatePopoverContext.date,
                      );
                      const needed = sitePostesForPopover
                        .map((p) => {
                          const required = getPosteRequirementForDay(
                            p,
                            d.getDay(),
                          );
                          const covered = countPosteCoverage(
                            siteShiftsForDate,
                            p,
                            templatePopoverContext.date,
                          );
                          return { poste: p, required, covered };
                        })
                        .filter(
                          (x) => x.required > 0 && x.covered < x.required,
                        );

                      if (needed.length === 0) return null;

                      return (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide font-semibold text-amber-600 mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Postes à combler
                          </div>
                          <div className="space-y-1.5">
                            {needed.map(({ poste, required, covered }) => {
                              const win = inferPosteWindow(poste);
                              return (
                                <button
                                  key={poste.id}
                                  type="button"
                                  onClick={() =>
                                    handleSelectPosteFromPopover(poste)
                                  }
                                  className="w-full text-left rounded-lg p-2.5 border border-amber-300/50 bg-amber-50/50 dark:bg-amber-500/10 hover:bg-amber-100/60 dark:hover:bg-amber-500/20 transition-all flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-sm truncate">
                                      {poste.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {win.start}–{win.end}
                                    </div>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 shrink-0"
                                  >
                                    {covered}/{required}
                                  </Badge>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                  {/* Standard shift templates */}
                  <div>
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">
                      Modèles du site
                    </div>
                    <div className="space-y-2">
                      {getSiteStandardShifts(activeSiteIdRef.current).length ===
                      0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Aucun modèle disponible
                        </p>
                      ) : (
                        getSiteStandardShifts(activeSiteIdRef.current).map(
                          (template) => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() =>
                                handleSelectTemplateFromPopover(template.id)
                              }
                              onMouseEnter={() =>
                                setSelectedPopoverTemplateId(template.id)
                              }
                              className={`w-full text-left rounded-lg p-3 text-white font-medium text-sm transition-all ring-2 ${
                                selectedPopoverTemplateId === template.id
                                  ? "ring-white/80 scale-[1.02] shadow-lg"
                                  : "ring-transparent hover:opacity-90"
                              }`}
                              style={{ backgroundColor: template.color }}
                            >
                              <div className="font-semibold">
                                {template.startTime} - {template.endTime}
                              </div>
                              <div className="text-xs opacity-80 mt-0.5">
                                ▶ {template.name}
                              </div>
                            </button>
                          ),
                        )
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="on_demand" className="m-0 p-3 space-y-3">
                {selectedPopoverTemplateId ? (
                  (() => {
                    const base = getSiteStandardShifts(
                      activeSiteIdRef.current,
                    ).find((t) => t.id === selectedPopoverTemplateId);
                    return base ? (
                      <div
                        className="rounded-lg p-3 text-white text-sm"
                        style={{ backgroundColor: base.color }}
                      >
                        <div className="text-xs opacity-70 mb-0.5">
                          Base sélectionnée
                        </div>
                        <div className="font-semibold">
                          {base.startTime} - {base.endTime}
                        </div>
                        <div className="text-xs opacity-80">
                          ▶ {base.name} • {base.breakDuration}min pause
                        </div>
                      </div>
                    ) : null;
                  })()
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez un modèle dans l&apos;onglet Modèle pour
                    l&apos;utiliser comme base, ou créez depuis zéro.
                  </p>
                )}
                <Button
                  className="w-full"
                  size="sm"
                  onClick={handleOpenCustomShiftFromPopover}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedPopoverTemplateId
                    ? "Personnaliser ce modèle"
                    : "Créer depuis zéro"}
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Agent Assignment Modal — multi-select */}
        {(() => {
          const activeSite = mockSites.find((s) => s.id === assignSiteId);
          const availableAgents = assignSiteId
            ? getAvailableAgentsForSite(assignSiteId)
            : [];
          const filteredAvailable = availableAgents.filter((a) => {
            const q = assignSearch.trim().toLowerCase();
            if (!q) return true;
            return (
              a.name.toLowerCase().includes(q) ||
              a.qualifications.some((c) => c.toLowerCase().includes(q)) ||
              a.contractType.toLowerCase().includes(q)
            );
          });

          return (
            <Modal
              open={showAgentCommand}
              onOpenChange={(open) => {
                setShowAgentCommand(open);
                if (!open) {
                  setAgentsToAssign([]);
                  setAssignSearch("");
                }
              }}
              type="form"
              size="lg"
              title="Affecter des agents"
              description={
                activeSite
                  ? `${activeSite.name} · ${availableAgents.length} agent${availableAgents.length > 1 ? "s" : ""} disponible${availableAgents.length > 1 ? "s" : ""}`
                  : "Sélectionnez un site puis les agents à affecter"
              }
              actions={{
                primary: {
                  label:
                    agentsToAssign.length > 0
                      ? `Affecter ${agentsToAssign.length} agent${agentsToAssign.length > 1 ? "s" : ""}`
                      : "Affecter",
                  onClick: handleBulkAssignAgents,
                  disabled: !assignSiteId || agentsToAssign.length === 0,
                },
                secondary: {
                  label: "Annuler",
                  onClick: () => setShowAgentCommand(false),
                },
              }}
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Site</Label>
                  <Select
                    value={assignSiteId}
                    onValueChange={(v) => {
                      setAssignSiteId(v);
                      activeSiteIdRef.current = v;
                      setAgentsToAssign([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un site" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSites
                        .filter((s) => s.status === "active")
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} — {s.clientName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Rechercher par nom, qualification ou contrat..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  disabled={!assignSiteId}
                />
                {!assignSiteId && (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    Sélectionnez un site pour voir les agents disponibles.
                  </div>
                )}

                {availableAgents.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    Tous les agents disponibles sont déjà assignés à ce site.
                  </div>
                ) : filteredAvailable.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Aucun agent ne correspond à « {assignSearch} ».
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {filteredAvailable.length} résultat
                        {filteredAvailable.length > 1 ? "s" : ""}
                      </span>
                      {agentsToAssign.length > 0 && (
                        <button
                          className="text-primary hover:underline"
                          onClick={() => setAgentsToAssign([])}
                        >
                          Tout désélectionner
                        </button>
                      )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto border rounded-md divide-y">
                      {filteredAvailable.map((agent) => {
                        const checked = agentsToAssign.includes(agent.id);
                        return (
                          <label
                            key={agent.id}
                            className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition ${checked ? "bg-primary/5" : "hover:bg-muted/50"}`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                toggleAgentToAssign(agent.id)
                              }
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">
                                  {agent.name}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-4 px-1.5"
                                >
                                  {agent.contractType}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {agent.weeklyHours}h/sem
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                {agent.qualifications.join(" · ")}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </Modal>
          );
        })()}

        {/* Shift Modal */}
        <Modal
          open={showShiftModal}
          onOpenChange={setShowShiftModal}
          type="form"
          size="lg"
          title={editingShift ? "Modifier le Shift" : "Ajouter un Shift"}
          actions={{
            secondary: {
              label: "Annuler",
              onClick: () => setShowShiftModal(false),
              variant: "outline",
            },
            primary: {
              label: editingShift ? "Enregistrer" : "Créer",
              onClick: handleSaveShift,
            },
            ...(shiftForm.shiftType === "on_demand" && !editingShift
              ? {
                  tertiary: {
                    label: "Enregistrer comme modèle",
                    onClick: () => setShowTemplateModal(true),
                    variant: "outline" as const,
                  },
                }
              : {}),
          }}
        >
          <div className="space-y-4">
            <Tabs
              value={shiftForm.shiftType}
              onValueChange={(v) =>
                setShiftForm({
                  ...shiftForm,
                  shiftType: v as "standard" | "on_demand",
                })
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard">Modèle</TabsTrigger>
                <TabsTrigger value="on_demand">Personnalisé</TabsTrigger>
              </TabsList>

              <TabsContent value="standard" className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">
                    Sélectionner un modèle de poste
                  </Label>
                  <div className="grid gap-3 mt-3">
                    {getSiteStandardShifts(activeSiteIdRef.current).map(
                      (template) => {
                        const length = calculateShiftLength(
                          template.startTime,
                          template.endTime,
                          template.breakDuration,
                        );
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() =>
                              setShiftForm({
                                ...shiftForm,
                                standardShiftId: template.id,
                                startTime: template.startTime,
                                endTime: template.endTime,
                                breakDuration: template.breakDuration,
                                color: template.color,
                              })
                            }
                            className={`flex items-center gap-4 p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                              shiftForm.standardShiftId === template.id
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "hover:border-primary/50"
                            }`}
                          >
                            <div
                              className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-sm"
                              style={{ backgroundColor: template.color }}
                            >
                              {template.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base mb-1">
                                {template.name}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="secondary"
                                  className="gap-1 font-medium"
                                >
                                  <Clock className="h-3 w-3" />
                                  {template.startTime} - {template.endTime}
                                  {isOvernightShift(
                                    template.startTime,
                                    template.endTime,
                                  ) && <Moon className="h-3 w-3 ml-1" />}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                  Pause: {template.breakDuration}min
                                </Badge>
                                <Badge variant="default" className="gap-1">
                                  {length}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                {editingShift?.shiftType === "on_demand" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setShiftForm({
                        ...shiftForm,
                        shiftType: "on_demand",
                      })
                    }
                    className="w-full"
                  >
                    Convertir en personnalisé
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="on_demand" className="space-y-5">
                {/* Shift Preview Card */}
                <div className="relative">
                  <Label className="text-base font-semibold mb-3 block">
                    Aperçu du créneau
                  </Label>
                  <div
                    className="relative rounded-lg border-l-4 p-4 shadow-sm overflow-hidden"
                    style={{
                      backgroundColor: shiftForm.color,
                      borderLeftColor: shiftForm.color,
                    }}
                  >
                    {shiftForm.isSplit ? (
                      // Split shift preview - show both slots
                      <div className="space-y-3">
                        {/* First slot */}
                        <div className="flex items-start justify-between gap-2 relative z-10">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-white/90 flex items-center gap-2 mb-1">
                              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                                1
                              </span>
                              {shiftForm.startTime || "00:00"} -{" "}
                              {shiftForm.endTime || "00:00"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-xs h-5 bg-white/20 text-white border-0"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {calculateShiftLength(
                                  shiftForm.startTime,
                                  shiftForm.endTime,
                                  shiftForm.breakDuration,
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {/* Break indicator */}
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-white/30"></div>
                          <span className="text-xs text-white/70 px-2">
                            Pause: {shiftForm.splitBreakDuration}min
                          </span>
                          <div className="h-px flex-1 bg-white/30"></div>
                        </div>
                        {/* Second slot */}
                        <div className="flex items-start justify-between gap-2 relative z-10">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-white/90 flex items-center gap-2 mb-1">
                              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                                2
                              </span>
                              {shiftForm.splitStartTime2 || "00:00"} -{" "}
                              {shiftForm.splitEndTime2 || "00:00"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-xs h-5 bg-white/20 text-white border-0"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {calculateShiftLength(
                                  shiftForm.splitStartTime2,
                                  shiftForm.splitEndTime2,
                                  0,
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {/* Total duration */}
                        <div className="pt-2 border-t border-white/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/80">
                              Total:
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs h-5 bg-white/30 text-white border-0 font-bold"
                            >
                              {(() => {
                                const calc = (
                                  s: string,
                                  e: string,
                                  b: number,
                                ) => {
                                  const [sh] = s.split(":").map(Number);
                                  const [eh] = e.split(":").map(Number);
                                  let m = eh * 60 - sh * 60;
                                  if (m < 0) m += 24 * 60;
                                  return m - b;
                                };
                                const total =
                                  calc(
                                    shiftForm.startTime,
                                    shiftForm.endTime,
                                    shiftForm.breakDuration,
                                  ) +
                                  calc(
                                    shiftForm.splitStartTime2,
                                    shiftForm.splitEndTime2,
                                    0,
                                  );
                                const h = Math.floor(total / 60);
                                const min = total % 60;
                                return `${h}h${min > 0 ? min : ""}`;
                              })()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Regular shift preview
                      <div className="flex items-start justify-between gap-2 relative z-10">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                            {isOvernightShift(
                              shiftForm.startTime,
                              shiftForm.endTime,
                            ) && <Moon className="h-4 w-4" />}
                            {shiftForm.startTime || "00:00"} -{" "}
                            {shiftForm.endTime || "00:00"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-xs h-5 bg-white/20 text-white border-0"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {calculateShiftLength(
                                shiftForm.startTime,
                                shiftForm.endTime,
                                shiftForm.breakDuration,
                              )}
                            </Badge>
                            {shiftForm.breakDuration > 0 && (
                              <span className="text-xs text-white/80">
                                Pause: {shiftForm.breakDuration}min
                              </span>
                            )}
                          </div>
                          {shiftForm.notes && (
                            <div className="text-xs text-white/80 mt-1 truncate">
                              {shiftForm.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Over 12h warning for non-split shifts */}
                    {!shiftForm.isSplit &&
                      (() => {
                        const [startH] = shiftForm.startTime
                          .split(":")
                          .map(Number);
                        const [endH] = shiftForm.endTime.split(":").map(Number);
                        let mins = endH * 60 - startH * 60;
                        if (mins < 0) mins += 24 * 60;
                        mins -= shiftForm.breakDuration;
                        if (mins > 12 * 60) {
                          return (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge
                                variant="secondary"
                                className="bg-orange-500 text-white border-0 gap-1"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                +12h
                              </Badge>
                            </div>
                          );
                        }
                        return null;
                      })()}
                  </div>
                </div>

                {/* Time Inputs */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Horaires
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm mb-2 block">Début</Label>
                      <Input
                        type="time"
                        value={shiftForm.startTime}
                        onChange={(e) =>
                          setShiftForm({
                            ...shiftForm,
                            startTime: e.target.value,
                          })
                        }
                        className="text-base"
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Fin</Label>
                      <Input
                        type="time"
                        value={shiftForm.endTime}
                        onChange={(e) =>
                          setShiftForm({
                            ...shiftForm,
                            endTime: e.target.value,
                          })
                        }
                        className="text-base"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 p-3 bg-muted rounded-lg">
                    <input
                      type="checkbox"
                      id="overnight"
                      checked={shiftForm.isOvernight}
                      onChange={(e) =>
                        setShiftForm({
                          ...shiftForm,
                          isOvernight: e.target.checked,
                        })
                      }
                      className="rounded h-4 w-4"
                    />
                    <Label
                      htmlFor="overnight"
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      <Moon className="h-4 w-4" />
                      Poste de nuit (se termine le jour suivant)
                    </Label>
                  </div>
                </div>

                {/* Split Shift Toggle */}
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <input
                    type="checkbox"
                    id="splitShift"
                    checked={shiftForm.isSplit}
                    onChange={(e) => {
                      // Auto-calculate split start time when enabling split
                      const calcSplitStart = (
                        endTime: string,
                        breakDuration: number,
                      ) => {
                        const [endH, endM] = endTime.split(":").map(Number);
                        let start2Mins = endH * 60 + endM + breakDuration;
                        if (start2Mins >= 24 * 60) start2Mins -= 24 * 60;
                        const start2H = Math.floor(start2Mins / 60);
                        const start2M = start2Mins % 60;
                        return `${start2H.toString().padStart(2, "0")}:${start2M.toString().padStart(2, "0")}`;
                      };
                      const newIsSplit = e.target.checked;
                      setShiftForm({
                        ...shiftForm,
                        isSplit: newIsSplit,
                        ...(newIsSplit
                          ? {
                              splitStartTime2: calcSplitStart(
                                shiftForm.endTime,
                                shiftForm.splitBreakDuration,
                              ),
                            }
                          : {}),
                      });
                    }}
                    className="rounded h-4 w-4"
                  />
                  <Label
                    htmlFor="splitShift"
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <Scissors className="h-4 w-4" />
                    Poste coupé (deux créneaux)
                  </Label>
                </div>

                {/* Split Shift Times */}
                {shiftForm.isSplit && (
                  <div className="p-4 border-2 border-dashed border-primary/30 rounded-lg space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Clock className="h-4 w-4" />
                      Deuxième créneau (pause: {shiftForm.splitBreakDuration}
                      min)
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm mb-2 block">Début 2</Label>
                        <Input
                          type="time"
                          value={shiftForm.splitStartTime2}
                          onChange={(e) =>
                            setShiftForm({
                              ...shiftForm,
                              splitStartTime2: e.target.value,
                            })
                          }
                          className="text-base"
                        />
                      </div>
                      <div>
                        <Label className="text-sm mb-2 block">Fin 2</Label>
                        <Input
                          type="time"
                          value={shiftForm.splitEndTime2}
                          onChange={(e) =>
                            setShiftForm({
                              ...shiftForm,
                              splitEndTime2: e.target.value,
                            })
                          }
                          className="text-base"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">
                        Pause entre les postes
                      </Label>
                      <Select
                        value={shiftForm.splitBreakDuration.toString()}
                        onValueChange={(v: string) => {
                          const newBreakDuration = parseInt(v);
                          // Auto-calculate split start time based on first shift end + break
                          const [endH, endM] = shiftForm.endTime
                            .split(":")
                            .map(Number);
                          let start2Mins = endH * 60 + endM + newBreakDuration;
                          if (start2Mins >= 24 * 60) start2Mins -= 24 * 60;
                          const start2H = Math.floor(start2Mins / 60);
                          const start2M = start2Mins % 60;
                          const newSplitStartTime2 = `${start2H.toString().padStart(2, "0")}:${start2M.toString().padStart(2, "0")}`;
                          setShiftForm({
                            ...shiftForm,
                            splitBreakDuration: newBreakDuration,
                            splitStartTime2: newSplitStartTime2,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 heure</SelectItem>
                          <SelectItem value="90">1h30</SelectItem>
                          <SelectItem value="120">2 heures</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Break Duration */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Durée de pause
                  </Label>
                  <Select
                    value={String(shiftForm.breakDuration)}
                    onValueChange={(v) =>
                      setShiftForm({ ...shiftForm, breakDuration: Number(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BREAK_DURATION_OPTIONS.map((min) => (
                        <SelectItem key={min} value={String(min)}>
                          {min === 0 ? "Aucune" : `${min} min`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Couleur du créneau
                  </Label>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      "#3b82f6",
                      "#f59e0b",
                      "#8b5cf6",
                      "#10b981",
                      "#ef4444",
                      "#ec4899",
                      "#06b6d4",
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setShiftForm({ ...shiftForm, color })}
                        className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                          shiftForm.color === color
                            ? "border-foreground scale-110 shadow-md"
                            : "border-border"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Notes (optionnel)
                  </Label>
                  <Input
                    value={shiftForm.notes}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, notes: e.target.value })
                    }
                    placeholder="Ajouter des notes sur ce créneau..."
                    className="text-base"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Modal>

        {/* Template Modal */}
        <Modal
          open={showTemplateModal}
          onOpenChange={setShowTemplateModal}
          type="form"
          title="Enregistrer comme modèle"
          actions={{
            secondary: {
              label: "Annuler",
              onClick: () => setShowTemplateModal(false),
              variant: "outline",
            },
            primary: {
              label: "Enregistrer",
              onClick: handleSaveAsTemplate,
            },
          }}
        >
          <div className="space-y-4">
            <div>
              <Label>Nom du modèle</Label>
              <Input
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, name: e.target.value })
                }
                placeholder="Ex: Matin, Après-midi, Nuit..."
              />
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div>
                Horaires: {shiftForm.startTime} - {shiftForm.endTime}
              </div>
              <div>Pause: {shiftForm.breakDuration} min</div>
              <div>
                Durée:{" "}
                {calculateShiftLength(
                  shiftForm.startTime,
                  shiftForm.endTime,
                  shiftForm.breakDuration,
                )}
              </div>
            </div>
          </div>
        </Modal>

        {/* Conflict Modal */}
        <Modal
          open={showConflictModal}
          onOpenChange={setShowConflictModal}
          type="warning"
          title="Conflit détecté"
          actions={
            conflictDetails?.conflict.type === "time_off"
              ? {
                  primary: {
                    label: "Fermer",
                    onClick: () => setShowConflictModal(false),
                  },
                }
              : {
                  tertiary: {
                    label: "Supprimer de l'autre site",
                    onClick: () => {
                      if (!conflictDetails?.conflict.details) return;
                      const conflictingShift = conflictDetails.conflict
                        .details as AgentShift;
                      if (
                        conflictDetails.conflict.type === "double_booking" &&
                        conflictingShift.id
                      ) {
                        handleDeleteShift(conflictingShift.id);
                      }
                      setShowConflictModal(false);
                      setConflictDetails(null);
                    },
                    variant: "outline",
                  },
                  secondary: {
                    label: "Garder ici",
                    onClick: () => setShowConflictModal(false),
                    variant: "outline",
                  },
                  primary: {
                    label: "Supprimer d'ici",
                    onClick: handleRemoveConflictingShift,
                    variant: "destructive",
                  },
                }
          }
        >
          {conflictDetails && (
            <div className="space-y-4">
              {/* Agent and Date Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {
                      planningAgents.find(
                        (a) => a.id === conflictDetails.agentId,
                      )?.name
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(conflictDetails.date).toLocaleDateString(
                      "fr-FR",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </div>
                </div>
              </div>

              {/* Conflict Details */}
              <div className="space-y-3">
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
                    conflictDetails.conflict.severity === "high"
                      ? "bg-red-50 border-red-400"
                      : "bg-yellow-50 border-yellow-400"
                  }`}
                >
                  <div
                    className={`p-2 rounded-full shrink-0 ${
                      conflictDetails.conflict.severity === "high"
                        ? "bg-red-600"
                        : "bg-yellow-600"
                    }`}
                  >
                    {conflictDetails.conflict.type === "time_off" ? (
                      <Ban className="h-5 w-5 text-white" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base mb-2 text-gray-900">
                      {conflictDetails.conflict.message}
                    </div>

                    {/* Time Off Details */}
                    {conflictDetails.conflict.type === "time_off" &&
                      conflictDetails.conflict.details && (
                        <div className="space-y-2 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="bg-white font-semibold text-gray-900 border border-gray-300"
                            >
                              {
                                (
                                  conflictDetails.conflict
                                    .details as TimeOffRequest
                                ).type
                              }
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="bg-white font-semibold text-gray-900 border border-gray-300"
                            >
                              {
                                (
                                  conflictDetails.conflict
                                    .details as TimeOffRequest
                                ).totalDays
                              }{" "}
                              jour
                              {(
                                conflictDetails.conflict
                                  .details as TimeOffRequest
                              ).totalDays > 1
                                ? "s"
                                : ""}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 font-semibold text-gray-900">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Du{" "}
                              {new Date(
                                (
                                  conflictDetails.conflict
                                    .details as TimeOffRequest
                                ).startDate,
                              ).toLocaleDateString("fr-FR")}{" "}
                              au{" "}
                              {new Date(
                                (
                                  conflictDetails.conflict
                                    .details as TimeOffRequest
                                ).endDate,
                              ).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                          {(conflictDetails.conflict.details as TimeOffRequest)
                            .reason && (
                            <div className="mt-2 p-3 bg-white rounded border border-gray-300">
                              <div className="font-bold text-gray-900 mb-1">
                                Raison:
                              </div>
                              <div className="text-gray-900">
                                {
                                  (
                                    conflictDetails.conflict
                                      .details as TimeOffRequest
                                  ).reason
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Double Booking Details */}
                    {conflictDetails.conflict.type === "double_booking" &&
                      conflictDetails.conflict.details && (
                        <div className="space-y-2 text-sm text-gray-900">
                          <div className="flex items-center gap-2 font-semibold">
                            <Clock className="h-4 w-4" />
                            <span className="font-bold">
                              {
                                (conflictDetails.conflict.details as AgentShift)
                                  .startTime
                              }{" "}
                              -{" "}
                              {
                                (conflictDetails.conflict.details as AgentShift)
                                  .endTime
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-semibold">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {
                                mockSites.find(
                                  (s) =>
                                    s.id ===
                                    (
                                      conflictDetails.conflict
                                        .details as AgentShift
                                    ).siteId,
                                )?.name
                              }
                            </span>
                          </div>
                          {(conflictDetails.conflict.details as AgentShift)
                            .notes && (
                            <div className="mt-2 p-3 bg-white rounded border border-gray-300">
                              <div className="font-bold text-gray-900 mb-1">
                                Notes:
                              </div>
                              <div className="text-gray-900">
                                {
                                  (
                                    conflictDetails.conflict
                                      .details as AgentShift
                                  ).notes
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Override Confirmation Modal */}
        <Modal
          open={showOverrideModal}
          onOpenChange={setShowOverrideModal}
          type="confirmation"
          title="Confirmer l'écrasement"
          actions={{
            secondary: {
              label: "Annuler",
              onClick: () => {
                setShowOverrideModal(false);
                setPendingPasteAction(null);
              },
              variant: "outline",
            },
            primary: {
              label: "Écraser",
              onClick: handleOverrideConfirm,
            },
          }}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Double affectation détectée</div>
                <div className="text-sm text-muted-foreground mt-1">
                  L&apos;agent est déjà affecté à un autre site pour cette
                  période. Voulez-vous écraser l&apos;affectation existante ?
                </div>
                <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                  <strong>Note:</strong> Les congés approuvés ne peuvent pas
                  être écrasés.
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Remove Agent Confirmation */}
        <Modal
          open={showRemoveAgentModal}
          onOpenChange={setShowRemoveAgentModal}
          type="warning"
          title="Retirer l'agent du site"
          actions={{
            secondary: {
              label: "Annuler",
              onClick: () => setShowRemoveAgentModal(false),
              variant: "outline",
            },
            primary: {
              label: "Retirer",
              onClick: confirmRemoveAgent,
              variant: "destructive",
            },
          }}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Êtes-vous sûr ?</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Cette action retirera l&apos;agent du site et supprimera tous
                  ses postes planifiés pour ce site.
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Past Date Warning Modal */}
        <Modal
          open={showPastDateWarning}
          onOpenChange={setShowPastDateWarning}
          type="warning"
          title="Date passée"
          description={
            pastDateWarningCtx
              ? `Date passée — ${new Date(pastDateWarningCtx.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
              : "Date passée"
          }
          actions={{
            secondary: {
              label: "Annuler",
              onClick: () => {
                setShowPastDateWarning(false);
                setPastDateWarningCtx(null);
              },
              variant: "outline",
            },
            primary: {
              label: "Continuer quand même",
              onClick: () => {
                if (!pastDateWarningCtx) return;
                setShowPastDateWarning(false);
                const { agentId, date } = pastDateWarningCtx;
                setPastDateWarningCtx(null);

                if (pastDateAction === "paste") {
                  // Re-run paste logic skipping past date check
                  if (!copiedShift) return;
                  const existingShift = agentShifts.find(
                    (s) =>
                      s.agentId === agentId &&
                      s.date === date &&
                      s.siteId === activeSiteIdRef.current,
                  );
                  if (existingShift) {
                    setAgentShifts(
                      agentShifts.filter((s) => s.id !== existingShift.id),
                    );
                  }
                  const newShift: AgentShift = {
                    ...copiedShift,
                    id: `shift-${Date.now()}-${Math.random()}`,
                    agentId,
                    date,
                    siteId: activeSiteIdRef.current!,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  setAgentShifts((prev) => [...prev, newShift]);
                  return;
                }

                // Re-run create logic skipping the past date check
                const conflict = getDateConflict(agentId, date);
                if (conflict?.type === "time_off") return;
                if (conflict?.type === "double_booking") {
                  setPendingPasteAction({
                    type: "shift",
                    agentId,
                    dates: [date],
                  });
                  setShowOverrideModal(true);
                  return;
                }
                setEditingShift(null);
                setShiftForm({
                  shiftType: "standard",
                  standardShiftId:
                    getSiteStandardShifts(activeSiteIdRef.current)[0]?.id || "",
                  startTime: "08:00",
                  endTime: "16:00",
                  breakDuration: 30,
                  color: "#3b82f6",
                  notes: "",
                  isOvernight: false,
                  isSplit: false,
                  splitStartTime2: "14:00",
                  splitEndTime2: "18:00",
                  splitBreakDuration: 60,
                });
                setTemplatePopoverContext({ agentId, date });
                setSelectedPopoverTemplateId(
                  getSiteStandardShifts(activeSiteIdRef.current)[0]?.id ?? null,
                );
                setShowTemplatePopover(true);
                window.__shiftContext = { agentId, date };
              },
            },
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Vous essayez d&apos;assigner un shift sur une date déjà passée.
              Cette action peut affecter les rapports et calculs de paie.
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
}
