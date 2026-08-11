export interface Equipment {
  id: string;
  name: string;
  type: "radio" | "uniform" | "epi" | "vehicle" | "other";
  category: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  status: "available" | "assigned" | "maintenance" | "lost" | "damaged";
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  returnDate?: string;
  location?: string;
  notes?: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  equipmentName: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  assignedAt: string;
  returnedAt?: string;
  condition: "good" | "fair" | "poor";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockEquipment: Equipment[] = [];

export const mockEquipmentAssignments: EquipmentAssignment[] = [];
