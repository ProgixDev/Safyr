import type {
  SiteAgentAssignment,
  AgentShift,
  StandardShift,
} from "@/lib/types";

export const mockStandardShifts: StandardShift[] = [];

export const mockSiteAgentAssignments: SiteAgentAssignment[] = [];

// Helper function to generate dates
const getDateString = (daysOffset: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
};

export const mockAgentShifts: AgentShift[] = [];

type TemplateRef = Pick<
  AgentShift,
  | "siteId"
  | "standardShiftId"
  | "startTime"
  | "endTime"
  | "breakDuration"
  | "color"
>;

function generateRotatingShifts(): AgentShift[] {
  const out: AgentShift[] = [];
  let seq = 1000;

  const push = (
    agentId: string,
    daysOffset: number,
    tmpl: TemplateRef,
    past: boolean,
  ) => {
    seq += 1;
    out.push({
      id: `shift-gen-${seq}`,
      agentId,
      siteId: tmpl.siteId,
      date: getDateString(daysOffset),
      shiftType: "standard",
      standardShiftId: tmpl.standardShiftId,
      startTime: tmpl.startTime,
      endTime: tmpl.endTime,
      breakDuration: tmpl.breakDuration,
      color: tmpl.color,
      completed: past,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  // Site 3 templates
  const s3Jour: TemplateRef = {
    siteId: "site-3",
    standardShiftId: "std-6",
    startTime: "07:00",
    endTime: "19:00",
    breakDuration: 60,
    color: "#8b5cf6",
  };
  const s3Nuit: TemplateRef = {
    siteId: "site-3",
    standardShiftId: "std-7",
    startTime: "19:00",
    endTime: "07:00",
    breakDuration: 60,
    color: "#6366f1",
  };

  // Site 4 templates
  const s4Mat: TemplateRef = {
    siteId: "site-4",
    standardShiftId: "std-8",
    startTime: "06:00",
    endTime: "14:00",
    breakDuration: 30,
    color: "#f97316",
  };
  const s4Apm: TemplateRef = {
    siteId: "site-4",
    standardShiftId: "std-9",
    startTime: "14:00",
    endTime: "22:00",
    breakDuration: 30,
    color: "#d97706",
  };

  // Site 5 template
  const s5Ron: TemplateRef = {
    siteId: "site-5",
    standardShiftId: "std-10",
    startTime: "20:00",
    endTime: "06:00",
    breakDuration: 45,
    color: "#ec4899",
  };

  // Cover -15 to +15 days from today
  for (let d = -15; d <= 15; d++) {
    const past = d < 0;
    const dayOfWeek = (d + 100) % 7; // rotating

    // Site 3 — 2-agent jour + 1-agent nuit (skip Sundays for variety)
    if (dayOfWeek !== 0) {
      push(d % 2 === 0 ? "5" : "6", d, s3Jour, past);
      if (d % 3 !== 0) push(d % 2 === 0 ? "6" : "5", d, s3Jour, past);
      push("7", d, s3Nuit, past);
    }

    // Site 4 — matin + apm pair
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      push(d % 2 === 0 ? "8" : "9", d, s4Mat, past);
      push(d % 2 === 0 ? "9" : "10", d, s4Apm, past);
    }

    // Site 5 — rondier, alternating
    if (d % 2 === 0) {
      push(d % 4 === 0 ? "11" : "12", d, s5Ron, past);
    }
  }

  return out;
}
