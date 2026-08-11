import type {
  Assignment,
  AssignmentStatus,
  AssignmentConflict,
  ScheduleAlert,
  ScheduleStats,
  ScheduleTemplate,
} from "@/lib/types";
import { mockSites, mockPostes } from "./sites";
import { mockEmployees } from "./employees";

// Helper to get random item from array
const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// Generate assignments for the next 2 weeks
const generateMockAssignments = (): Assignment[] => {
  const assignments: Assignment[] = [];
  const today = new Date();
  const agents = mockEmployees.slice(0, 15); // Use first 15 employees as agents

  // Generate assignments for next 14 days
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);

    // Create 3-5 assignments per day
    const assignmentsPerDay = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < assignmentsPerDay; i++) {
      const agent = randomItem(agents);
      const site = randomItem(mockSites);

      // Skip if site has no postes
      if (!site.postes || site.postes.length === 0) continue;

      const poste = randomItem(site.postes);

      // Skip if poste or schedule is undefined
      if (!poste || !poste.schedule) continue;

      const startHour = 6 + Math.floor(Math.random() * 12); // Between 6 AM and 6 PM
      const duration = poste.schedule?.defaultShiftDuration || 8;
      const endHour = startHour + duration;

      const startTime = `${startHour.toString().padStart(2, "0")}:00`;
      const endTime = `${endHour.toString().padStart(2, "0")}:00`;

      const status: AssignmentStatus =
        dayOffset < 2
          ? "completed"
          : dayOffset < 5
            ? randomItem(["confirmed", "in_progress"] as AssignmentStatus[])
            : "scheduled";

      // Detect conflicts (simplified)
      const conflicts: AssignmentConflict[] = [];
      const hasConflicts = Math.random() < 0.1; // 10% chance of conflict

      if (hasConflicts) {
        conflicts.push({
          type: randomItem([
            "double_booking",
            "missing_qualification",
            "hours_exceeded",
          ] as const),
          severity: "warning",
          message: "Conflit détecté",
          details:
            "Cet agent a déjà une affectation qui chevauche cette période",
        });
      }

      assignments.push({
        id: `ASG-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}-${i + 1}`,
        agentId: agent.id,
        agentName: `${agent.firstName} ${agent.lastName}`,
        siteId: site.id,
        siteName: site.name,
        posteId: poste.id,
        posteName: poste.name,
        startDate: date,
        endDate: date,
        startTime,
        endTime,
        plannedHours: duration,
        breakDuration: poste.schedule?.breakDuration || 30,
        actualHours:
          status === "completed"
            ? duration + (Math.random() < 0.3 ? 0.5 : 0)
            : undefined,
        status,
        confirmedByAgent: status !== "scheduled",
        confirmedAt:
          status !== "scheduled"
            ? new Date(date.getTime() - 24 * 60 * 60 * 1000)
            : undefined,
        conflicts,
        hasConflicts,
        notes:
          Math.random() < 0.2 ? "Mission urgente - priorité haute" : undefined,
        createdAt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        createdBy: "system",
      });
    }
  }

  return assignments.sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );
};

export const mockAssignments = generateMockAssignments();

// Generate mock alerts
export const mockScheduleAlerts: ScheduleAlert[] = [];

// Calculate schedule stats
export const mockScheduleStats: ScheduleStats = {
  totalAssignments: mockAssignments.length,
  confirmed: mockAssignments.filter(
    (a) =>
      a.status === "confirmed" ||
      a.status === "in_progress" ||
      a.status === "completed",
  ).length,
  pending: mockAssignments.filter((a) => a.status === "scheduled").length,
  conflicts: mockAssignments.filter((a) => a.hasConflicts).length,
  coverageRate: 94.5,
  totalHours: mockAssignments.reduce((sum, a) => sum + a.plannedHours, 0),
  agentsAssigned: new Set(mockAssignments.map((a) => a.agentId)).size,
};

// Mock schedule templates
export const mockScheduleTemplates: ScheduleTemplate[] = (() => {
  try {
    return [
      {
        id: "TPL-001",
        name: "Ronde Week-end Centre Commercial",
        description:
          "Planning type pour la surveillance du centre commercial les week-ends",
        recurrence: "weekly",
        pattern: {
          daysOfWeek: [0, 6], // Samedi et Dimanche
        },
        assignments: [
          {
            id: "TPLA-001",
            siteId: mockSites[0]?.id || "SITE-001",
            posteId: mockPostes[0]?.id || "POST-001",
            startTime: "08:00",
            endTime: "16:00",
            breakDuration: 30,
          },
          {
            id: "TPLA-002",
            siteId: mockSites[0]?.id || "SITE-001",
            posteId: mockPostes[1]?.id || "POST-002",
            startTime: "16:00",
            endTime: "00:00",
            breakDuration: 30,
          },
        ],
        active: true,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-10"),
        createdBy: "admin",
      },
      {
        id: "TPL-002",
        name: "Surveillance Nuit Entrepôt",
        description: "Patrouilles de nuit pour l'entrepôt logistique",
        recurrence: "daily",
        pattern: {
          daysOfWeek: [1, 2, 3, 4, 5], // Lundi à Vendredi
        },
        assignments: [
          {
            id: "TPLA-003",
            siteId: mockSites[1]?.id || "SITE-002",
            posteId: mockPostes[2]?.id || "POST-003",
            startTime: "22:00",
            endTime: "06:00",
            breakDuration: 45,
          },
        ],
        active: true,
        createdAt: new Date("2024-12-15"),
        updatedAt: new Date("2025-01-05"),
        createdBy: "admin",
      },
      {
        id: "TPL-003",
        name: "Accueil Bureau 9h-17h",
        description: "Contrôle d'accès standard pour les bureaux en journée",
        recurrence: "weekly",
        pattern: {
          daysOfWeek: [1, 2, 3, 4, 5],
        },
        assignments: [
          {
            id: "TPLA-004",
            siteId: mockSites[2]?.id || "SITE-003",
            posteId: mockPostes[3]?.id || "POST-004",
            startTime: "09:00",
            endTime: "17:00",
            breakDuration: 60,
          },
        ],
        active: true,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        createdBy: "admin",
      },
    ];
  } catch {
    return [];
  }
})();
