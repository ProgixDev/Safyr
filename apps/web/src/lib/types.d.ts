// ============================================================================
// COMPANY TYPES
// ============================================================================

export interface Company {
  id: string;
  name: string;
  legalForm: string;
  siret: string;
  vatNumber?: string;
  authorizationNumber?: string; // N° D'autorisation ou carte CNAPS - CAPITAL
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  bankDetails: {
    bankName: string;
    iban: string;
    bic: string;
  };
  legalRepresentative: {
    firstName: string;
    lastName: string;
    status: "GERANT" | "PRESIDENT";
    phone: string;
    email: string;
    cnapsCardNumber: string;
  };
  administrativeDocuments: {
    legalRepCNI?: string; // File URL
    directorCnapsCard?: string;
    companyCnapsCard?: string;
    kbis?: string;
    urssafVigilance?: string;
    fiscalRegularity?: string;
    rcProInsurance?: string;
    rib?: string;
  };
  expirationAlerts: {
    directorCnapsExpiry?: Date;
    companyCnapsExpiry?: Date;
  };
  subcontractors: Subcontractor[];
  clients: Client[];
  // Add more fields as needed for complete company fiche
}

export interface Subcontractor {
  id: string;
  name: string;
  contracts: SubcontractorContract[];
}

export interface SubcontractorContract {
  id: string;
  subcontractorId: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  fileUrl?: string;
  status: "active" | "expired" | "terminated";
}

export interface DirigeantInfo {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  adresse: string;
  email: string;
  telephone: string;
  fonction: string;
  dateNomination: string;
  numeroSecuriteSociale: string;
}

export interface Client {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  siret?: string;
  numTVA?: string;
  sector?: string;
  dirigeant?: DirigeantInfo;
  contracts: ClientContract[];
  gifts: ClientGift[];
}

export interface ClientContract {
  id: string;
  clientId: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  fileUrl?: string;
  status: "active" | "expired" | "terminated";
}

export interface ClientGift {
  id: string;
  clientId: string;
  giftDescription: string;
  date: Date;
  valueHT?: number; // Hors Tax
  tva?: number; // TVA
  valueTTC?: number; // Toutes Taxes Comprises
  notes?: string;
}

// ============================================================================
// RECRUITMENT & INTEGRATION TYPES
// ============================================================================

export interface JobApplication {
  id: string;
  employeeId?: string;
  applicantName: string;
  email: string;
  phone: string;
  position: string;
  cv?: string; // File URL
  coverLetter?: string; // File URL
  status: "pending" | "reviewed" | "interviewed" | "accepted" | "rejected";
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegulatoryVerification {
  id: string;
  applicationId: string;
  cnapsVerified: boolean;
  diplomasVerified: boolean;
  cnapsNumber?: string;
  diplomaFiles: string[]; // File URLs
  verifiedAt?: Date;
  verifiedBy?: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  task: string; // e.g., "Upload ID", "Complete training"
  category: "documents" | "training" | "equipment" | "other";
  status: "pending" | "completed";
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingPath {
  id: string;
  employeeId: string;
  employeeName: string;
  tasks: OnboardingTask[];
  startDate: Date;
  completionDate?: Date;
  status: "in-progress" | "completed";
  progress: number; // Percentage
  createdAt: Date;
  updatedAt: Date;
}

export interface RecruitmentStats {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  totalVerifications: number;
  pendingVerifications: number;
  completedOnboardings: number;
  inProgressOnboardings: number;
}

export interface RecruitmentKPIs {
  successRate: number; // percentage of accepted applications
  averageDelay: number; // days from application to hire
  totalCost: number; // total recruitment cost
  costPerHire: number; // average cost per successful hire
  currency: string;
}

// ============================================================================
// EMAIL TEMPLATE TYPES
// ============================================================================

// ============================================================================
// TRAINING & CERTIFICATIONS TYPES
// ============================================================================

export interface TrainingCertification {
  id: string;
  employeeId: string;
  employeeName: string;
  type: CertificationType;
  level?: string; // for SSIAP 1/2/3
  number: string;
  issueDate: Date;
  expiryDate: Date;
  issuer: string;
  fileUrl?: string;
  status:
    | "valid"
    | "expired"
    | "expiring-soon"
    | "pending-renewal"
    | "acknowledged";
  lastRenewalDate?: Date;
  nextRenewalDate?: Date;
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CertificationType =
  | "SSIAP1"
  | "SSIAP2"
  | "SSIAP3"
  | "SST"
  | "H0B0"
  | "FIRE"
  | "OTHER";

export interface TrainingSession {
  id: string;
  employeeId: string;
  employeeName: string;
  certificationType: CertificationType;
  sessionDate: Date;
  duration: number;
  trainer: string;
  result: "passed" | "failed" | "pending";
  certificateNumber?: string;
  expiryDate?: Date;
  cost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingPlan {
  id: string;
  title: string;
  description?: string;
  plannedDate: Date;
  duration: number; // hours
  participants: string[]; // employeeIds
  trainer?: string;
  location?: string;
  budget: number;
  currency: string;
  status: "planned" | "confirmed" | "completed" | "cancelled";
  actualDate?: Date;
  actualDuration?: number;
  actualCost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingBudget {
  year: number;
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  currency: string;
  breakdown: {
    byType: Record<CertificationType, number>;
    byDepartment: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingStats {
  totalCertifications: number;
  validCertifications: number;
  expiredCertifications: number;
  expiringSoon: number;
  complianceRate: number; // percentage
  totalTrainingHours: number;
  totalTrainingCost: number;
  currency: string;
}

// ============================================================================
// EMAIL TEMPLATE TYPES
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: EmailTemplateCategory;
  tags: string[];
  lastModified: string;
}

export interface EmailTemplateFormData {
  name: string;
  subject: string;
  body: string;
  category: EmailTemplateCategory;
  tags: string[];
}

export type EmailTemplateCategory =
  | "rh"
  | "recrutement"
  | "formation"
  | "discipline"
  | "conges"
  | "paie"
  | "medical"
  | "autre";

export interface EmailTemplateCategoryOption {
  value: EmailTemplateCategory;
  label: string;
}

// ============================================================================
// EMPLOYEE TYPES
// ============================================================================

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  dateOfBirth: Date;
  placeOfBirth: string;
  nationality: string;
  gender: "male" | "female" | "other";

  // Civil Status
  civilStatus: "single" | "married" | "divorced" | "widowed" | "civil-union";
  children?: number;

  // Address
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    proofOfAddress?: string; // File path/URL
  };

  // Bank Details
  bankDetails: {
    iban: string;
    bic: string;
    bankName: string;
  };

  // Social Security
  socialSecurityNumber: string;
  healthCard?: string; // File path/URL

  // Employment
  employeeNumber: string;
  hireDate: Date;
  position: string;
  department: string;
  contractType?: Contract["type"];
  workSchedule: "full-time" | "part-time";
  status: "active" | "inactive" | "suspended" | "terminated";
  role?: "owner" | "agent";

  // Soumis à l'indemnité d'habillage (calculée auto en paie selon les heures)
  dressingAllowance?: boolean;

  // Documents
  documents: EmployeeDocuments;

  // Contracts
  contracts: Contract[];

  // Equipment
  assignedEquipment: Equipment[];

  // CSE
  cseRole?: CSERole;

  // Savings Plans
  savingsPlans: {
    pee: {
      contributions: number;
      balance: number;
      lastContributionDate?: Date;
    };
    pereco: {
      contributions: number;
      balance: number;
      lastContributionDate?: Date;
    };
  };
  hasClothingAllowance?: boolean;
  clothingAllowanceRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  gender: Employee["gender"];
  civilStatus: Employee["civilStatus"];
  children: number;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  iban: string;
  bic: string;
  bankName: string;
  socialSecurityNumber: string;
  employeeNumber: string;
  hireDate: string;
  position: string;
  department: string;
  contractType?: Contract["type"];
  workSchedule: "full-time" | "part-time";
  status: Employee["status"];
  cnapsNumber: string;
  ssiapNumber: string;
}

export interface EmployeeDocuments {
  idCard?: Document;
  cv?: Document;
  proCard?: Document; // CNAPS Professional Card

  // Diplomas and Certifications
  cqpAps?: Certification;
  ssiap?: Certification;
  sst?: Certification; // Sauveteur Secouriste du Travail
  vm?: Certification; // Visite Médicale (Medical Visit)
}

export interface Document {
  id: string;
  name: string;
  type:
    | "id-card"
    | "health-card"
    | "cv"
    | "proof-address"
    | "pro-card"
    | "dpae"
    | "due"
    | "other";
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy: string;
  expiresAt?: Date;
  verified: boolean;
  notes?: string;
}

export interface Certification {
  id: string;
  type:
    | "CQP_APS"
    | "CNAPS"
    | "SSIAP1"
    | "SSIAP2"
    | "SSIAP3"
    | "SST"
    | "VM"
    | "H0B0"
    | "FIRE";
  number: string;
  issueDate: Date;
  expiryDate: Date;
  fileUrl?: string;
  issuer: string;
  verified: boolean;
  status: "valid" | "expired" | "expiring-soon" | "pending-renewal";
}

export interface Contract {
  id: string;
  employeeId?: string;
  type: "CDI" | "CDD" | "INTERIM" | "APPRENTICESHIP" | "INTERNSHIP";
  contractType?: "full-time" | "part-time"; // Temps complet (151.67h) ou temps partiel
  startDate: Date;
  endDate?: Date;
  position: string;
  department: string;

  // Salary and classification
  salary: {
    gross: number;
    net: number;
    currency: string;
  };
  hourlyRate?: number; // Taux horaire brut
  category?: string; // Catégorie (ex: Agent de sécurité, Chef d'équipe)
  level?: string; // Niveau
  echelon?: string; // Échelon
  coefficient?: number; // Coefficient

  workingHours: number; // Hours per week
  fileUrl?: string;
  signedAt?: Date;
  signedByEmployee: boolean;
  signedByEmployer: boolean;

  // Probation Period
  probationPeriod?: {
    duration: number;
    unit: "months" | "weeks" | "days";
  };
  probationStartDate?: Date;
  probationEndDate?: Date;
  probationRenewed: boolean;
  probationRenewalDate?: Date;
  probationRenewalEndDate?: Date;
  probationStatus?: "active" | "completed" | "renewed" | "failed";

  // Amendments
  amendments: ContractAmendment[];

  status: "draft" | "pending-signature" | "active" | "terminated" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractAmendment {
  id: string;
  contractId: string;
  date: Date;
  reason: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  fileUrl?: string;
  signedAt?: Date;
}

export interface Equipment {
  id: string;
  name: string;
  type:
    | "PPE"
    | "RADIO"
    | "KEYS"
    | "UNIFORM"
    | "BADGE"
    | "VEHICLE"
    | "VACATION_VOUCHER"
    | "GIFT_CARD"
    | "CESU"
    | "FUEL_CARD"
    | "MEAL_VOUCHER"
    | "OTHER";
  serialNumber?: string;
  description?: string;
  quantity?: number;
  consumable?: boolean;

  // Assignment
  assignedAt: Date;
  assignedBy: string;
  returnedAt?: Date;
  returnedBy?: string;

  // Digital Signature
  issuanceSignature?: Signature;
  returnSignature?: Signature;

  condition: "new" | "good" | "fair" | "poor" | "damaged";
  status: "assigned" | "returned" | "lost" | "damaged" | "exhausted";
  notes?: string;
}

export interface Signature {
  signedAt: Date;
  signedBy: string;
  signatureData: string; // Base64 encoded signature
  ipAddress?: string;
  device?: string;
}

export interface CSERole {
  role: "member" | "alternate" | "secretary" | "treasurer" | "president";
  startDate: Date;
  endDate?: Date;
  delegationHours: number; // Hours per month
  usedHours: number;
  remainingHours: number;
  isElected: boolean;
  electionDate?: Date;
}

export interface ExpirationAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  type:
    | "pro-card"
    | "ssiap"
    | "vm"
    | "sst"
    | "contract"
    | "certification"
    | "probation";
  documentName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  severity: "critical" | "high" | "medium" | "low";
  status: "pending" | "acknowledged" | "resolved";
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface CNAPSAccess {
  employeeId: string;
  cnapsNumber: string;
  lastChecked?: Date;
  status: "valid" | "invalid" | "pending" | "error";
  dracarLink?: string; // Direct link to CNAPS DRACAR system
}

export interface EmployeeFilters {
  status?: Employee["status"][];
  department?: string[];
  position?: string[];
  contractType?: Contract["type"][];
  certificationStatus?: "valid" | "expired" | "expiring-soon";
  search?: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  expiringCertifications: number;
  pendingContracts: number;
  cseMembers: number;
}

// ============================================================================
// TIME MANAGEMENT & ABSENCES TYPES
// ============================================================================

export type TimeOffType =
  | "vacation"
  | "sick_leave"
  | "unpaid_leave"
  | "maternity_leave"
  | "paternity_leave"
  | "family_event"
  | "training"
  | "cse_delegation";

export type TimeOffStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  type: TimeOffType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  status: TimeOffStatus;
  validatedBy?: string;
  validatedAt?: Date;
  validationComment?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkedHours {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  regularHours: number;
  supplementaryHours25: number; // 25% increase
  supplementaryHours50: number; // 50% increase
  complementaryHours10: number; // 10% for part-time employees
  nightHours: number;
  sundayHours: number;
  sundayNightHours: number; // Sunday night hours
  holidayHours: number;
  holidayNightHours: number; // Holiday night hours
  createdAt: Date;
  updatedAt: Date;
}

export interface CSEDelegationHours {
  id: string;
  employeeId: string;
  employeeName: string;
  cseRole: string;
  period: string; // e.g., "2024-12" for December 2024
  allocatedHours: number;
  usedHours: number;
  remainingHours: number;
  sessions: CSESession[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CSESession {
  id: string;
  date: Date;
  duration: number;
  type: "meeting" | "training" | "employee_reception" | "other";
  description: string;
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
}

export interface AbsenceSummary {
  employeeId: string;
  employeeName: string;
  year: number;
  vacationDays: {
    total: number;
    taken: number;
    remaining: number;
    pending: number;
  };
  sickLeaveDays: number;
  unpaidLeaveDays: number;
  otherAbsenceDays: number;
  totalAbsenceDays: number;
}

export interface TimeOffBalance {
  employeeId: string;
  year: number;
  vacationDaysEarned: number;
  vacationDaysTaken: number;
  vacationDaysPending: number;
  vacationDaysRemaining: number;
  carriedOverDays: number;
  totalAvailable: number;
}

export interface PayrollExport {
  id: string;
  period: string; // e.g., "2024-12"
  exportDate: Date;
  employeeCount: number;
  status: "pending" | "completed" | "failed";
  fileUrl?: string;
  createdBy: string;
  createdAt: Date;
}

export interface TimeManagementStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAbsenceDays: number;
  averageResponseTime: number; // in hours
  employeesOnLeave: number;
}

export interface TimeOffFilters {
  status?: TimeOffStatus;
  type?: TimeOffType;
  department?: string;
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// PAYROLL PREPARATION & ANALYSES TYPES
// ============================================================================

export interface PayrollVariable {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // e.g., "2024-12"
  type: PayrollVariableType;
  amount: number;
  currency: string;
  description?: string;
  status: "pending" | "validated" | "refused";
  processedBy?: string;
  processedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PayrollVariableType =
  | "h_jour"
  | "h_dimanche"
  | "h_ferie"
  | "h_nuit"
  | "h_dimanche_nuit"
  | "h_ferie_nuit"
  | "h_supp_25"
  | "h_supp_50"
  | "h_compl_10"
  | "nbre_paniers"
  | "frais_restauration"
  | "prime"
  | "indemnite_habillage"
  | "tenue"
  | "nbre_deplacement"
  | "autres_indemnites";

export interface Allowance {
  id: string;
  employeeId: string;
  employeeName: string;
  type: AllowanceType;
  amount: number;
  currency: string;
  frequency: "monthly" | "daily" | "one-time";
  startDate: Date;
  endDate?: Date;
  description?: string;
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AllowanceType =
  | "travel"
  | "meal"
  | "dressing"
  | "transport"
  | "housing"
  | "phone"
  | "other";

export interface SalaryMaintenance {
  id: string;
  employeeId: string;
  employeeName: string;
  type: SalaryMaintenanceType;
  startDate: Date;
  endDate?: Date;
  dailyRate: number;
  totalDays: number;
  totalAmount: number;
  currency: string;
  medicalCertificate?: string; // File URL
  status: "active" | "completed" | "pending";
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SalaryMaintenanceType =
  | "illness"
  | "work_accident"
  | "maternity"
  | "paternity"
  | "family_event"
  | "other";

export interface PersonnelCost {
  employeeId: string;
  employeeName: string;
  period: string;
  grossSalary: number;
  netSalary: number;
  taxableNet: number;
  employeeContributions: number;
  employerContributions: number;
  totalEmployerCost: number;
  currency: string;
  workedHours: number;
  costPerHour: number;
  allowances: number;
  bonuses: number;
  maintenance: number;
  totalCost: number;
}

export interface PayrollAnomaly {
  id: string;
  executionId?: string;
  controlId?: string;
  employeeId: string;
  employeeName: string;
  type: PayrollAnomalyType;
  title?: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical" | "info" | "warning";
  period: string;
  date?: Date;
  expectedValue?: number;
  actualValue?: number;
  currency?: string;
  status:
    | "open"
    | "investigating"
    | "resolved"
    | "dismissed"
    | "pending"
    | "reviewed"
    | "corrected"
    | "ignored"
    | "false_positive";
  resolvedBy?: string;
  resolvedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  assignedTo?: string;
  notes?: string;
  details?: PayrollAnomalyDetail;
  autoCorrectAvailable?: boolean;
  correction?: PayrollAnomalyCorrection;
  createdAt: Date;
  updatedAt: Date;
}

export type PayrollAnomalyType =
  | "missing_hours"
  | "incorrect_rate"
  | "duplicate_payment"
  | "missing_allowance"
  | "contribution_error"
  | "tax_calculation_error"
  | "hours_vs_planning"
  | "duplicate_entry"
  | "missing_entry"
  | "excessive_hours"
  | "insufficient_rest"
  | "bonus_inconsistency"
  | "ijss_mismatch"
  | "ijss_missing"
  | "overtime_limit"
  | "other";

export interface PayrollExportConfig {
  id: string;
  name: string;
  software: "silae" | "sage" | "other";
  format: "csv" | "xlsx" | "xml" | "json";
  mapping: Record<string, string>; // Field mapping for export
  delimiter?: string;
  includeHeaders: boolean;
  dateFormat: string;
  currencyFormat: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollAnalysis {
  period: string;
  totalEmployees: number;
  totalGrossPayroll: number;
  totalNetPayroll: number;
  totalEmployerContributions: number;
  totalEmployeeContributions: number;
  totalPersonnelCost: number;
  averageCostPerEmployee: number;
  averageCostPerHour: number;
  currency: string;
  breakdowns: {
    byDepartment: Record<string, PersonnelCostSummary>;
    byContractType: Record<string, PersonnelCostSummary>;
    byAllowanceType: Record<string, number>;
  };
  anomalies: PayrollAnomaly[];
  createdAt: Date;
}

export interface PersonnelCostSummary {
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  totalEmployerCost: number;
  averageCostPerEmployee: number;
  averageCostPerHour: number;
}

export interface PayrollStats {
  totalVariables: number;
  pendingValidations: number;
  anomaliesCount: number;
  totalPersonnelCost: number;
  averageCostPerEmployee: number;
  currency: string;
  lastExportDate?: Date;
  nextPayrollDate?: Date;
}

// Payroll Variable Import Types
export type ImportSource = "planning" | "hr" | "external" | "manual";

export type ImportStatus =
  | "pending"
  | "importing"
  | "imported"
  | "error"
  | "validated";

export interface PlanningHoursImport {
  normalHours: number;
  nightHours: number;
  holidayHours: number;
  overtimeHours25: number;
  overtimeHours50: number;
  sundayHours: number;
  sundayNightHours: number;
  holidayNightHours: number;
  onCallHours: number;
  mealAllowances: number;
  travelAllowances: number;
  dressingAllowances: number;
  uniformAllowances: number;
}

export interface HRAbsencesImport {
  sickLeave: number;
  workAccident: number;
  paidLeave: number;
  unpaidLeave: number;
  exceptionalLeave: number;
  maternityLeave: number;
  paternityLeave: number;
  unionHours: number;
  salaryDeductions: number;
}

export interface CoherenceCheck {
  id: string;
  employeeId: string;
  employeeName: string;
  checkType: "error" | "warning" | "info";
  category: "hours" | "absences" | "allowances" | "contract" | "legal";
  message: string;
  details?: string;
  expectedValue?: number;
  actualValue?: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface EmployeePayrollVariables {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // e.g., "2024-12"
  position: string;
  contractType: "CDI" | "CDD" | "Intérim" | "Apprentissage";

  // Import status per source
  planningImportStatus: ImportStatus;
  planningImportDate?: Date;
  hrImportStatus: ImportStatus;
  hrImportDate?: Date;
  externalImportStatus: ImportStatus;
  externalImportDate?: Date;

  // Planning data
  planningData: PlanningHoursImport;

  // HR data
  hrData: HRAbsencesImport;

  // Validation
  validated: boolean;
  validatedBy?: string;
  validatedAt?: Date;

  // Coherence checks
  hasErrors: boolean;
  hasWarnings: boolean;
  coherenceChecks: CoherenceCheck[];

  // Metadata
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
  notes?: string;
}

export interface PayrollControl {
  id: string;
  name: string;
  category: "hours" | "legal" | "bonuses" | "ijss" | "duplicates" | "general";
  description: string;
  enabled: boolean;
  severity: "info" | "warning" | "critical";
}

export interface ControlExecution {
  id: string;
  periodId: string;
  period: string;
  startedAt: Date;
  completedAt?: Date;
  status: "running" | "completed" | "failed";
  controlsRun: string[]; // control IDs
  totalAnomalies: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  employeesAffected: number;
  autoCorrectableCount: number;
}

export interface PayrollAnomalyDetail {
  expected?: unknown;
  actual?: unknown;
  related?: unknown;
  planningData?: unknown;
  variableData?: unknown;
}

export interface PayrollAnomalyCorrection {
  action: string;
  description: string;
  payload: unknown;
}

export interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  label: string; // e.g., "Décembre 2024"
  status:
    | "draft"
    | "importing"
    | "review"
    | "validated"
    | "calculated"
    | "closed";
  startDate: Date;
  endDate: Date;
  totalEmployees: number;
  importedEmployees: number;
  validatedEmployees: number;
  totalErrors: number;
  totalWarnings: number;
  createdBy: string;
  createdAt: Date;
  closedBy?: string;
  closedAt?: Date;
}

// Payroll Calculation Types
export type PayrollCalculationStatus =
  | "pending"
  | "calculating"
  | "calculated"
  | "validated"
  | "error"
  | "exported";

export interface SalaryElement {
  id: string;
  code: string;
  label: string;
  type: "earning" | "deduction";
  category:
    | "base"
    | "hours"
    | "overtime"
    | "bonus"
    | "allowance"
    | "absence"
    | "advance"
    | "other";
  quantity?: number;
  rate?: number;
  amount: number;
  taxable: boolean;
  subjectToContributions: boolean;
}

export interface SocialContributionDetail {
  id: string;
  code: string;
  label: string;
  type: "employee" | "employer";
  category:
    | "health"
    | "retirement"
    | "unemployment"
    | "family"
    | "accident"
    | "csg"
    | "crds"
    | "other";
  baseAmount: number;
  rate: number;
  amount: number;
  ceiling?: number;
  tranche?: "A" | "B" | "C";
}

export interface EmployeePayrollCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  period: string; // e.g., "2024-12"
  status: PayrollCalculationStatus;
  position: string;
  contractType: "CDI" | "CDD" | "Intérim" | "Apprentissage";

  // Calculation elements
  salaryElements: SalaryElement[];
  grossSalary: number;

  // Deductions
  employeeContributions: SocialContributionDetail[];
  totalEmployeeContributions: number;

  // Net amounts
  netSalary: number;
  netTaxable: number;
  netTaxableYTD: number;
  netToPay: number;

  // Employer side
  employerContributions: SocialContributionDetail[];
  totalEmployerContributions: number;
  totalCost: number;

  // IJSS (sick leave benefits)
  ijssAmount?: number;
  ijssDeduction?: number;
  salaryMaintenance?: number;

  // Calculation metadata
  calculatedAt?: Date;
  calculatedBy?: string;
  validatedAt?: Date;
  validatedBy?: string;
  errors: string[];
  warnings: string[];
  notes?: string;
}

export interface PayrollCalculationRun {
  id: string;
  period: string;
  periodLabel: string;
  status: PayrollCalculationStatus;
  totalEmployees: number;
  calculatedEmployees: number;
  pendingEmployees: number;
  errorEmployees: number;
  validatedEmployees: number;

  // Financial totals
  totalGrossSalary: number;
  totalNetSalary: number;
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
  totalCost: number;

  // Metadata
  startedAt?: Date;
  startedBy?: string;
  completedAt?: Date;
  validatedAt?: Date;
  validatedBy?: string;
  exportedAt?: Date;

  calculations: EmployeePayrollCalculation[];
}

export interface PaySlip {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  calculationId: string;
  pdfUrl?: string;
  generatedAt?: Date;
  sentAt?: Date;
  sentTo?: string;
  viewedAt?: Date;
  status: "draft" | "generated" | "sent" | "viewed" | "archived";
}

export interface DSNDeclaration {
  id: string;
  period: string;
  type: "monthly" | "event";
  status: "draft" | "generated" | "validated" | "sent" | "acknowledged";
  totalEmployees: number;
  totalGrossSalary: number;
  totalContributions: number;
  fileUrl?: string;
  generatedAt?: Date;
  sentAt?: Date;
  acknowledgmentDate?: Date;
  errors: string[];
}

// Discipline & Legal Types
export interface Warning {
  id: string;
  employeeId: string;
  date: Date;
  reason: string;
  description: string;
  issuedBy: string;
  status: "active" | "lifted";
  createdAt: Date;
  updatedAt: Date;
}

export interface Suspension {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  description: string;
  issuedBy: string;
  status: "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface DisciplinaryProcedure {
  id: string;
  employeeId: string;
  startDate: Date;
  steps: DisciplinaryStep[];
  currentStep: number;
  status: "ongoing" | "completed" | "cancelled";
  documents: string[]; // file URLs
  createdAt: Date;
  updatedAt: Date;
}

export interface DisciplinaryStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
}

export interface Interview {
  id: string;
  employeeId: string;
  type: "professional" | "annual";
  date: Date;
  interviewer: string;
  notes: string;
  objectives: string[];
  status: "scheduled" | "completed" | "cancelled";
  documents?: string[]; // file URLs
  createdAt: Date;
  updatedAt: Date;
}

export interface Objective {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  category: "performance" | "development" | "career" | "skills";
  targetDate: Date;
  progress: number; // 0-100
  status: "active" | "completed" | "cancelled";
  relatedInterviewId?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sanction {
  id: string;
  employeeId: string;
  date: Date;
  type: string;
  reason: string;
  description: string;
  issuedBy: string;
  severity: "minor" | "major" | "severe";
  createdAt: Date;
  updatedAt: Date;
}

export interface SanctionsRegister {
  id: string;
  employeeId: string;
  sanctions: Sanction[];
  totalWarnings: number;
  totalSuspensions: number;
  lastUpdated: Date;
}

// Alias types for Mises à pied (disciplinary suspensions)
export type MiseAPied = Sanction;

export interface MisesAPiedRegister {
  id: string;
  employeeId: string;
  misesAPied: MiseAPied[];
  totalWarnings: number;
  totalSuspensions: number;
  lastUpdated: Date;
}

// ============================================================================
// EXPENSE REPORTS & ALLOWANCES TYPES
// ============================================================================

export interface ExpenseItem {
  id: string;
  category: "travel" | "meal" | "accommodation" | "fuel" | "parking" | "other";
  description: string;
  amount: number;
  date: Date;
  receipt?: string; // File URL
  notes?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
}

export interface ExpenseReport {
  id: string;
  employeeId: string;
  title: string;
  items: ExpenseItem[];
  totalAmount: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  paymentDate?: Date;
  exportedToPayroll: boolean;
  exportedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// LEGAL REGISTERS TYPES
// ============================================================================

export interface PersonnelRegisterEntry {
  id: string;
  employeeId: string;
  registrationNumber: string;
  entryDate: Date;
  exitDate?: Date;
  contractType: "CDI" | "CDD" | "apprentice" | "interim" | "other";
  contractWorkTime?: "partiel" | "complet";
  position: string;
  qualification: string;
  nationality: string;
  sex?: "M" | "F";
  birthDate: Date;
  birthPlace: string;
  address?: string;
  phone?: string;
  email?: string;
  socialSecurityNumber?: string;
  cnapsProfessionalCardNumber?: string;
  ssiapDiplomaNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkAccident {
  id: string;
  employeeId: string;
  accidentDate: Date;
  accidentTime: string;
  location: string;
  description: string;
  injuries: string;
  witnesses?: string[];
  medicalCertificate?: string; // File URL
  declarationDate: Date;
  declarationNumber?: string;
  workStoppage: boolean;
  workStoppageStart?: Date;
  workStoppageEnd?: Date;
  returnToWork?: Date;
  severity: "minor" | "moderate" | "severe" | "fatal";
  status: "declared" | "investigating" | "closed";
  cpamNotified: boolean;
  cpamNotificationDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingRegisterEntry {
  id: string;
  employeeId: string;
  trainingName: string;
  trainingType:
    | "SSIAP"
    | "SST"
    | "CQP"
    | "H0B0"
    | "fire"
    | "professional"
    | "regulatory"
    | "other";
  trainingOrganization: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in hours
  cost: number;
  fundingSource: "company" | "opco" | "personal" | "other";
  certificationObtained: boolean;
  certificationDate?: Date;
  certificationNumber?: string;
  expirationDate?: Date;
  certificate?: string; // File URL
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CDDRegisterEntry {
  id: string;
  employeeId: string;
  contractNumber: string;
  contractType: "CDD" | "apprentice" | "interim";
  entryDate: Date;
  exitDate?: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  position: string;
  reason:
    | "replacement"
    | "seasonal"
    | "temporary_increase"
    | "specific_project"
    | "other";
  reasonDetails?: string;
  renewalCount: number;
  previousContractId?: string;
  exitReason?:
    | "end_of_contract"
    | "early_termination"
    | "conversion_to_cdi"
    | "dismissal"
    | "resignation"
    | "other";
  exitReasonDetails?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// WORKFLOWS & HR REQUESTS TYPES
// ============================================================================

export type HRRequestType =
  | "certificate"
  | "document"
  | "bank_details"
  | "address"
  | "civil_status";

export type HRRequestStatus =
  | "pending"
  | "in_progress"
  | "validated"
  | "refused"
  | "cancelled";

export type CertificateType =
  | "employment"
  | "salary"
  | "work"
  | "internship"
  | "other";

export type DocumentType =
  | "payslip"
  | "contract"
  | "attestation"
  | "tax_document"
  | "social_security"
  | "other";

export interface RequestHistoryEntry {
  id: string;
  timestamp: Date;
  action:
    | "created"
    | "status_changed"
    | "comment_added"
    | "document_attached"
    | "assigned"
    | "completed";
  status?: HRRequestStatus;
  performedBy: string;
  performedByName: string;
  comment?: string;
  attachments?: string[];
}

export interface HRRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  type: HRRequestType;
  status: HRRequestStatus;
  submittedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  processedByName?: string;
  validationComment?: string;
  refusalReason?: string;
  assignedTo?: string;
  assignedToName?: string;
  priority: "low" | "normal" | "high" | "urgent";
  dueDate?: Date;
  history: RequestHistoryEntry[];
  attachments?: string[];
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateRequest extends Omit<HRRequest, "type"> {
  type: "certificate";
  certificateType: CertificateType;
  reason: string;
  quantity: number;
  language: "fr" | "en";
  deliveryMethod: "email" | "pickup" | "mail";
  deliveryAddress?: string;
  generatedCertificateUrl?: string;
  generatedAt?: Date;
}

export interface DocumentRequest extends Omit<HRRequest, "type"> {
  type: "document";
  documentType: DocumentType;
  documentDescription: string;
  period?: string; // For payslips, e.g., "2024-12"
  year?: number; // For tax documents, contracts
  specificDetails?: string;
  deliveryMethod: "email" | "pickup" | "mail";
  deliveryAddress?: string;
  documentUrl?: string;
  providedAt?: Date;
}

export interface PersonalInfoChangeRequest extends Omit<HRRequest, "type"> {
  type: "bank_details" | "address" | "civil_status";
  changeType: "bank_details" | "address" | "civil_status";

  // Bank details change
  currentBankDetails?: {
    iban: string;
    bic: string;
    bankName: string;
  };
  newBankDetails?: {
    iban: string;
    bic: string;
    bankName: string;
  };
  ribDocument?: string; // File URL

  // Address change
  currentAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  newAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  proofOfAddress?: string; // File URL

  // Civil status change
  currentCivilStatus?: Employee["civilStatus"];
  newCivilStatus?: Employee["civilStatus"];
  supportingDocuments?: string[]; // Marriage certificate, divorce decree, etc.
  effectiveDate?: Date;

  // Approval metadata
  approvalRequired: boolean;
  approvedBy?: string;
  approvedByName?: string;
  appliedToSystem: boolean;
  appliedAt?: Date;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  requestType: HRRequestType;
  enabled: boolean;

  // Conditions
  conditions: {
    employeeTenureMinMonths?: number;
    departmentWhitelist?: string[];
    requestTypeWhitelist?: (CertificateType | DocumentType)[];
    maxAmount?: number;
    requiresManagerApproval?: boolean;
  };

  // Actions
  actions: {
    autoApprove?: boolean;
    autoAssignTo?: string;
    setPriority?: "low" | "normal" | "high" | "urgent";
    sendNotificationTo?: string[];
    addTags?: string[];
  };

  // Execution tracking
  executionCount: number;
  lastExecutedAt?: Date;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  validatedRequests: number;
  refusedRequests: number;
  cancelledRequests: number;

  // By type
  certificateRequests: number;
  documentRequests: number;
  personalInfoChangeRequests: number;

  // Performance metrics
  averageProcessingTime: number; // in hours
  requestsByPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };

  // Time-based
  requestsThisWeek: number;
  requestsThisMonth: number;

  oldestPendingRequest?: Date;
}

export interface WorkflowFilters {
  status?: HRRequestStatus[];
  type?: HRRequestType[];
  priority?: ("low" | "normal" | "high" | "urgent")[];
  employeeId?: string;
  department?: string;
  dateFrom?: Date;
  dateTo?: Date;
  assignedTo?: string;
  search?: string;
}

// ============================================================================
// ELECTRONIC SIGNATURES & DEMATERIALIZATION TYPES
// ============================================================================

export type SignatureType =
  | "contract"
  | "disciplinary_sanction"
  | "equipment_delivery"
  | "equipment_return"
  | "acknowledgment"
  | "hr_validation";

export type SignatureStatus =
  | "pending"
  | "sent"
  | "signed"
  | "refused"
  | "expired"
  | "cancelled";

export type SignatureMethod = "eidas" | "simple" | "advanced" | "qualified";

export interface SignatureParticipant {
  id: string;
  name: string;
  email: string;
  role: "signer" | "approver" | "observer";
  signedAt?: Date;
  signatureMethod?: SignatureMethod;
  ipAddress?: string;
  deviceInfo?: string;
  refusalReason?: string;
  status: "pending" | "signed" | "refused";
}

export interface SignatureDocument {
  id: string;
  name: string;
  type: SignatureType;
  documentUrl: string;
  signedDocumentUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface SignatureAuditEntry {
  id: string;
  timestamp: Date;
  action:
    | "created"
    | "sent"
    | "viewed"
    | "signed"
    | "refused"
    | "reminded"
    | "expired"
    | "cancelled"
    | "completed";
  performedBy: string;
  performedByName: string;
  participantId?: string;
  details?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface SignatureWorkflow {
  id: string;
  type: SignatureType;
  title: string;
  description?: string;
  status: SignatureStatus;
  documents: SignatureDocument[];
  participants: SignatureParticipant[];
  initiatedBy: string;
  initiatedByName: string;
  employeeId?: string;
  employeeName?: string;
  contractId?: string;
  sanctionId?: string;
  equipmentId?: string;
  acknowledgmentType?: string;
  requiresEidas: boolean;
  signatureMethod: SignatureMethod;
  sequentialSigning: boolean;
  reminderEnabled: boolean;
  reminderFrequency?: number;
  sentAt?: Date;
  completedAt?: Date;
  lastReminderSent?: Date;
  expiresAt?: Date;
  auditTrail: SignatureAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SignatureStats {
  totalWorkflows: number;
  pendingSignatures: number;
  completedSignatures: number;
  refusedSignatures: number;
  expiredSignatures: number;
  contractSignatures: number;
  sanctionSignatures: number;
  equipmentSignatures: number;
  acknowledgmentSignatures: number;
  hrValidationSignatures: number;
  averageCompletionTime: number;
  completionRate: number;
  signaturesThisWeek: number;
  signaturesThisMonth: number;
}

export interface SignatureFilters {
  status?: SignatureStatus[];
  type?: SignatureType[];
  signatureMethod?: SignatureMethod[];
  employeeId?: string;
  initiatedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Agenda Types
export type CalendarScope = "global" | "personal";
export type CalendarViewMode = "month" | "week" | "day";

export interface CalendarSettings {
  defaultView: CalendarViewMode;
  defaultScope: CalendarScope;
  showWeekends: boolean;
  startHour: number;
  endHour: number;
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string;
  type: "meeting" | "call" | "event" | "other";
  color: string;
  scope: CalendarScope;
  userId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// PAYROLL SOCIAL REPORT TYPES
// ============================================================================

export interface PayrollSocialReportPeriod {
  year: number;
  month?: number; // Optional for annual reports
  label: string;
}

export interface PayrollMasses {
  grossTotal: number;
  netTotal: number;
  netTaxable: number;
  employerContributions: number;
  employeeContributions: number;
  totalEmployerCost: number;
}

export interface PayrollCostAnalysis {
  averageGrossSalary: number;
  averageNetSalary: number;
  averageEmployerCost: number;
  averageHourlyCost: number;
  hourlyCostByCategory: {
    category: string;
    cost: number;
    hoursWorked: number;
  }[];
  hourlyCostBySite: {
    siteId: string;
    siteName: string;
    cost: number;
    hoursWorked: number;
  }[];
  hourlyCostByTeam: {
    teamId: string;
    teamName: string;
    cost: number;
    hoursWorked: number;
  }[];
}

export interface DemographicBreakdown {
  total: number;
  byGender: {
    male: number;
    female: number;
  };
  byAge: {
    range: string;
    count: number;
  }[];
  bySeniority: {
    range: string;
    count: number;
  }[];
  byContractType: {
    cdi: number;
    cdd: number;
    apprentices: number;
    interim: number;
  };
  byStatus: {
    agent: number;
    administrative: number;
    manager: number;
  };
}

export interface TurnoverMetrics {
  entries: number;
  exits: number;
  globalRate: number;
  bySite: {
    siteId: string;
    siteName: string;
    entries: number;
    exits: number;
    rate: number;
  }[];
  byContractType: {
    contractType: string;
    entries: number;
    exits: number;
    rate: number;
  }[];
  exitReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
}

export interface ContractMetrics {
  cdiCount: number;
  cddCount: number;
  cddRenewed: number;
  averageCddDuration: number; // in months
  durationDistribution: {
    range: string;
    count: number;
  }[];
}

export interface AbsenceMetrics {
  totalDays: number;
  globalRate: number;
  byType: {
    type: string;
    label: string;
    days: number;
    rate: number;
    cost: number;
  }[];
  averageDuration: number;
  directCost: number;
  indirectCost: number;
  totalCost: number;
}

export interface WorkAccidentMetrics {
  total: number;
  withStoppage: number;
  withoutStoppage: number;
  averageStoppageDays: number;
  frequencyRate: number;
  gravityRate: number;
  cost: number;
}

export interface GenderEqualityMetrics {
  averageMaleGross: number;
  averageFemaleGross: number;
  gap: number;
  gapPercentage: number;
  bySalaryCategory: {
    category: string;
    maleAverage: number;
    femaleAverage: number;
    gap: number;
    gapPercentage: number;
  }[];
}

export interface YearOverYearComparison {
  currentYear: number;
  previousYear: number;
  grossMassEvolution: number;
  grossMassEvolutionPercentage: number;
  employerContributionsEvolution: number;
  employerContributionsEvolutionPercentage: number;
  employeeContributionsEvolution: number;
  employeeContributionsEvolutionPercentage: number;
  totalCostEvolution: number;
  totalCostEvolutionPercentage: number;
  hourlyCostEvolution: number;
  hourlyCostEvolutionPercentage: number;
  headcountEvolution: number;
  headcountEvolutionPercentage: number;
}

export interface PayrollSocialReport {
  period: PayrollSocialReportPeriod;
  generatedAt: Date;
  generatedBy: string;

  // Main metrics
  masses: PayrollMasses;
  costAnalysis: PayrollCostAnalysis;
  demographics: DemographicBreakdown;
  turnover: TurnoverMetrics;
  contracts: ContractMetrics;
  absences: AbsenceMetrics;
  workAccidents: WorkAccidentMetrics;
  genderEquality: GenderEqualityMetrics;

  // Comparative analysis
  comparison?: YearOverYearComparison;
}

// ========================================
// Payroll Workflow Types
// ========================================

// Organism Rule - cotisations sociales (taxes applied via organisms like URSSAF, AGIRC-ARRCO)
export interface OrganismRule {
  id: string;
  code: string;
  name: string; // e.g., "Assurance maladie", "Retraite complémentaire"
  organism: string; // e.g., "URSSAF", "AGIRC-ARRCO"
  category:
    | "health"
    | "retirement"
    | "unemployment"
    | "family"
    | "accident"
    | "csg"
    | "crds"
    | "other";
  appliesTo: "employee" | "employer" | "both";
  rateEmployee?: number; // percentage for employee
  rateEmployer?: number; // percentage for employer
  ceiling?: number; // plafond
  tranche?: "A" | "B" | "C" | "all";
  isActive: boolean;
  effectiveDate: string;
  endDate?: string;
  description?: string;
}

// Applied organism rule in calculation
export interface OrganismRuleApplication {
  ruleId: string;
  ruleName: string;
  ruleCode: string;
  organism: string;
  category: OrganismRule["category"];
  baseAmount: number;
  rate: number;
  amount: number;
  ceiling?: number;
  tranche?: "A" | "B" | "C";
}

// State Help - réductions/aides employeur
export interface StateHelp {
  id: string;
  code: string;
  name: string; // e.g., "Réduction Fillon", "Aide à l'embauche"
  type: "reduction" | "credit" | "exoneration";
  calculationMethod: "percentage" | "fixed" | "formula";
  rate?: number;
  amount?: number;
  formula?: string;
  conditions: string[];
  maxAmount?: number;
  isActive: boolean;
  effectiveDate: string;
  endDate?: string;
  description?: string;
}

// Applied state help in calculation
export interface StateHelpApplication {
  helpId: string;
  helpName: string;
  helpCode: string;
  type: StateHelp["type"];
  baseAmount: number;
  calculatedAmount: number;
  appliedAmount: number; // after max cap
}

// Prime types configuration (included in gross salary, subject to contributions)
export interface PrimeType {
  id: string;
  code: string;
  name: string; // e.g., "Prime d'ancienneté", "Prime temps d'habillage"
  category:
    | "anciennete"
    | "habillage"
    | "risque"
    | "astreinte"
    | "objectif"
    | "other";
  subjectToContributions: boolean; // Always true for primes
  defaultAmount?: number;
  calculationMethod: "fixed" | "per_day" | "per_hour" | "percentage" | "custom";
  isActive: boolean;
  description?: string;
}

// Applied prime in calculation (included in gross)
export interface PrimeApplication {
  typeId: string;
  typeName: string;
  typeCode: string;
  category: PrimeType["category"];
  quantity?: number; // hours or days
  rate?: number; // hourly or daily rate
  amount: number;
  subjectToContributions: boolean; // Always true
}

// Indemnité types configuration (added to net, not subject to contributions)
export interface IndemniteType {
  id: string;
  code: string;
  name: string; // e.g., "Indemnité de panier", "Indemnité transport"
  category:
    | "transport"
    | "repas"
    | "logement"
    | "habillement"
    | "outillage"
    | "anciennete"
    | "risque"
    | "other";
  taxable: boolean; // Usually false for indemnités
  subjectToContributions: boolean; // Usually false for indemnités
  defaultAmount?: number;
  calculationMethod: "fixed" | "per_day" | "per_hour" | "percentage" | "custom";
  isActive: boolean;
  description?: string;
}

// Applied indemnité in calculation (added to net)
export interface IndemniteApplication {
  typeId: string;
  typeName: string;
  typeCode: string;
  category: IndemniteType["category"];
  quantity?: number; // days or occurrences
  rate?: number; // daily rate
  amount: number;
  taxable: boolean; // Usually false
  subjectToContributions: boolean; // Usually false
  description?: string; // e.g., "22 jours × 5.40€"
}

// Leave Balance - Congés tracking
export interface LeaveBalance {
  employeeId: string;
  period: string;
  congesPayes: {
    previousBalance: number; // solde N-1
    acquired: number; // acquis période en cours
    taken: number; // pris
    remaining: number; // solde restant
    monthlyAccrual: number; // 2.5 jours/mois
  };
  rtt?: {
    acquired: number;
    taken: number;
    remaining: number;
  };
  congesAnciennete?: {
    acquired: number;
    taken: number;
    remaining: number;
  };
}

// Worked hours breakdown for brute calculation
export interface WorkedHoursBreakdown {
  normalHours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  overtime25: number; // heures sup majorées 25%
  overtime50: number; // heures sup majorées 50%
  overtime100: number; // heures sup majorées 100%
  totalHours: number;
}

// Time off deduction detail
export interface TimeOffDeduction {
  type: TimeOffType;
  days: number;
  hours: number;
  dailyRate: number;
  amount: number; // negative for deduction
  ijssAmount?: number; // if applicable
  salaryMaintenance?: boolean;
}

// Employee tax (Prélèvement à la Source)
export interface EmployeeTax {
  type: "pas" | "other";
  name: string;
  baseAmount: number;
  rate: number;
  amount: number;
}

// Complete payroll calculation workflow
export interface PayrollCalculationWorkflow {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  period: string;
  status: PayrollCalculationStatus;
  position: string;
  contractType: "CDI" | "CDD" | "Intérim" | "Apprentissage";

  // Step 1: Brute calculation (excludes indemnités)
  workedHours: WorkedHoursBreakdown;
  baseSalary: number; // salaire de base mensuel
  hoursAmount: number; // montant heures travaillées
  overtimeAmount: number; // montant heures supplémentaires
  nightBonus: number; // majoration nuit
  sundayBonus: number; // majoration dimanche
  holidayBonus: number; // majoration jours fériés
  timeOffDeductions: TimeOffDeduction[];
  totalTimeOffDeduction: number;

  // Primes (included in gross salary, subject to contributions)
  primes: PrimeApplication[];
  totalPrimes: number;

  bruteSalary: number; // Total brut = baseSalary + hours + overtime + bonuses + primes - timeOff

  // Step 2: Employee deductions from organism rules
  employeeDeductions: OrganismRuleApplication[];
  totalEmployeeDeductions: number;

  // Step 3: Employer charges from organism rules
  employerCharges: OrganismRuleApplication[];
  totalEmployerCharges: number;

  // Step 4: State help for employer
  stateHelps: StateHelpApplication[];
  totalStateHelp: number;
  employerNetCharges: number; // totalEmployerCharges - totalStateHelp

  // Step 5: Indemnités (added to net after deductions, not subject to contributions)
  indemnites: IndemniteApplication[];
  totalIndemnitesNonTaxable: number;
  totalIndemnitesTaxable: number;
  totalIndemnites: number;

  // Step 6: Employee taxes (PAS)
  netBeforeTax: number;
  employeeTaxes: EmployeeTax[];
  totalEmployeeTaxes: number;

  // Step 7: Final amounts
  netToPay: number;
  totalEmployerCost: number; // bruteSalary + indemnités taxables + employerNetCharges

  // Leave balance
  leaveBalance: LeaveBalance;

  // Calculation metadata
  calculatedAt?: Date;
  calculatedBy?: string;
  validatedAt?: Date;
  validatedBy?: string;
  errors: string[];
  warnings: string[];
  notes?: string;
}

// Payroll calculation run with workflow
export interface PayrollCalculationRunWorkflow {
  id: string;
  period: string;
  periodLabel: string;
  status: PayrollCalculationStatus;
  totalEmployees: number;
  calculatedEmployees: number;
  pendingEmployees: number;
  errorEmployees: number;
  validatedEmployees: number;

  // Financial totals
  totalBruteSalary: number;
  totalIndemnites: number;
  totalEmployeeDeductions: number;
  totalEmployerCharges: number;
  totalStateHelp: number;
  totalEmployeeTaxes: number;
  totalNetToPay: number;
  totalEmployerCost: number;

  // Metadata
  startedAt?: Date;
  startedBy?: string;
  completedAt?: Date;
  validatedAt?: Date;
  validatedBy?: string;
  exportedAt?: Date;

  calculations: PayrollCalculationWorkflow[];
}

// ============================================================================
// PLANNING TYPES - SITES & POSTES
// ============================================================================

export type PosteType =
  | "agent_securite"
  | "ssiap1"
  | "ssiap2"
  | "ssiap3"
  | "operateur_video"
  | "accueil"
  | "manager"
  | "rh"
  | "comptable"
  | "rondier"
  | "agent_cynophile"
  | "chef_de_poste"
  | "di"
  | "autres";

export interface Site {
  id: string;
  name: string;
  color: import("@/lib/site-colors").SiteColor;
  clientId: string;
  clientName: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  contact: {
    name: string;
    phone: string;
    email: string;
    position?: string;
  };
  // Contraintes spécifiques
  constraints: {
    mandatoryHours?: string[]; // Ex: ["08:00-18:00"]
    requiredCertifications: string[]; // Ex: ["CQP APS", "SSIAP 1"]
    accessInstructions?: string;
    specialRequirements?: string;
  };
  // Facturation
  billing: {
    hourlyRate: number; // Taux horaire de facturation
    overtimeRate?: number;
    nightRate?: number;
    weekendRate?: number;
    holidayRate?: number;
  };
  // Metadata
  status: "active" | "inactive" | "suspended";
  contractStartDate: Date;
  contractEndDate?: Date;
  postes: Poste[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  notes?: string;
}

export interface Poste {
  id: string;
  siteId: string;
  name: string;
  type: PosteType;
  description?: string;
  // Exigences
  requirements: {
    requiredCertifications: string[]; // Ex: ["CQP APS", "SSIAP 1"]
    requiredQualifications?: string[];
  };
  // Planning
  schedule: {
    defaultShiftDuration: number; // en heures
    breakDuration?: number; // en minutes
    nightShift: boolean;
    weekendWork: boolean;
    rotatingShift: boolean;
    vacationStart?: string;
    vacationEnd?: string;
  };
  // Capacité
  capacity: {
    minAgents: number; // Nombre minimum d'agents requis
    maxAgents: number; // Nombre maximum d'agents
    currentAgents?: number; // Nombre d'agents actuellement affectés
  };
  // Exigences quotidiennes par jour
  dailyRequirements?: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  // Instructions
  instructions?: {
    duties: string[]; // Tâches à effectuer
    procedures?: string; // Procédures spécifiques
    equipment?: string[]; // Équipement nécessaire
    emergencyContact?: string;
  };
  // Metadata
  status: "active" | "inactive";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface SiteFormData {
  name: string;
  color: import("@/lib/site-colors").SiteColor;
  clientId: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactPosition?: string;
  mandatoryHours?: string;
  requiredCertifications: string[];
  accessInstructions?: string;
  specialRequirements?: string;
  hourlyRate: number;
  overtimeRate?: number;
  nightRate?: number;
  weekendRate?: number;
  holidayRate?: number;
  status: "active" | "inactive" | "suspended";
  contractStartDate: string;
  contractEndDate?: string;
  notes?: string;
}

export interface PosteFormData {
  name: string;
  type: PosteType;
  description?: string;
  requiredCertifications: string[];
  requiredQualifications?: string[];
  vacationStart: string;
  vacationEnd: string;
  defaultShiftDuration: number;
  breakDuration?: number;
  nightShift: boolean;
  weekendWork: boolean;
  rotatingShift: boolean;
  minAgents: number;
  maxAgents: number;
  duties?: string;
  procedures?: string;
  equipment: string[];
  emergencyContact?: string;
  status: "active" | "inactive";
  priority: "low" | "medium" | "high" | "critical";
}

export interface SiteStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  totalPostes: number;
  activePostes: number;
  agentsDeployed: number;
  coverageRate: number; // Pourcentage de postes couverts
}

// ============================================================================
// PLANNING TYPES - SITE SHIFTS & SCHEDULING
// ============================================================================

export type ShiftType = "standard" | "on_demand";

export interface StandardShift {
  id: string;
  siteId: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  breakDuration: number; // minutes
  color: string; // hex color
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentShift {
  id: string;
  agentId: string;
  siteId: string;
  date: string; // YYYY-MM-DD format
  shiftType: ShiftType;
  // For standard shifts
  standardShiftId?: string;
  // For on-demand shifts
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  breakDuration: number; // minutes
  color: string; // hex color
  notes?: string;
  // Split shift support
  isSplit?: boolean; // Whether this is a split shift (two parts)
  splitStartTime2?: string; // HH:mm format - second shift start
  splitEndTime2?: string; // HH:mm format - second shift end
  splitBreakDuration?: number; // minutes - break between split parts
  // Completion status (for past shifts)
  completed?: boolean; // Whether the agent completed the shift
  completedAt?: Date; // When the shift was marked as completed
  noShow?: boolean; // Agent didn't show up for the shift
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteAgentAssignment {
  id: string;
  siteId: string;
  agentId: string;
  agentName: string;
  assignedAt: Date;
  active: boolean;
}

export interface ShiftCopyData {
  agentId: string;
  shiftType: ShiftType;
  standardShiftId?: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  color: string;
  notes?: string;
}

export type ScheduleViewType = "daily" | "weekly" | "monthly";

// ============================================================================
// PLANNING TYPES - ASSIGNMENTS & SCHEDULE
// ============================================================================

export type AssignmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type AssignmentConflictType =
  | "double_booking"
  | "missing_qualification"
  | "hours_exceeded"
  | "workload_exceeded"
  | "unavailable";

export type AlertSeverity = "info" | "warning" | "error" | "critical";

export interface Assignment {
  id: string;
  agentId: string;
  agentName: string;
  siteId: string;
  siteName: string;
  posteId: string;
  posteName: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  plannedHours: number;
  breakDuration?: number;
  actualHours?: number;
  status: AssignmentStatus;
  confirmedByAgent?: boolean;
  confirmedAt?: Date;
  conflicts: AssignmentConflict[];
  hasConflicts: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy?: string;
}

export interface AssignmentConflict {
  type: AssignmentConflictType;
  severity: AlertSeverity;
  message: string;
  details?: string;
  relatedAssignmentId?: string;
}

export interface ScheduleAlert {
  id: string;
  type: AssignmentConflictType;
  severity: AlertSeverity;
  title: string;
  message: string;
  assignmentId?: string;
  agentId?: string;
  siteId?: string;
  posteId?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export type ScheduleView = "daily" | "weekly" | "monthly";
export type ScheduleGroupBy = "agent" | "site" | "poste";

export interface ScheduleFilters {
  view: ScheduleView;
  groupBy: ScheduleGroupBy;
  startDate: Date;
  endDate: Date;
  agentIds?: string[];
  siteIds?: string[];
  posteIds?: string[];
  status?: AssignmentStatus[];
  showConflicts?: boolean;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  recurrence: "daily" | "weekly" | "monthly";
  pattern: {
    daysOfWeek?: number[];
    weeksOfMonth?: number[];
    monthsOfYear?: number[];
  };
  assignments: TemplateAssignment[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TemplateAssignment {
  id: string;
  agentId?: string;
  siteId: string;
  posteId: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  notes?: string;
}

export interface AutoScheduleRequest {
  startDate: Date;
  endDate: Date;
  siteIds?: string[];
  posteIds?: string[];
  prioritizeQualifications: boolean;
  prioritizeCost: boolean;
  allowOvertime: boolean;
  maxHoursPerAgent?: number;
  templateId?: string;
}

export interface AutoScheduleResult {
  success: boolean;
  assignmentsCreated: number;
  conflicts: ScheduleAlert[];
  unfilledShifts: UnfilledShift[];
  message?: string;
}

export interface UnfilledShift {
  siteId: string;
  siteName: string;
  posteId: string;
  posteName: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
  suggestedAgents?: SuggestedAgent[];
}

export interface SuggestedAgent {
  agentId: string;
  agentName: string;
  matchScore: number;
  qualificationMatch: boolean;
  availabilityStatus: "available" | "partial" | "unavailable";
  hoursThisWeek: number;
  conflicts: string[];
}

export interface AssignmentFormData {
  agentId: string;
  siteId: string;
  posteId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  notes?: string;
}

export interface ScheduleStats {
  totalAssignments: number;
  confirmed: number;
  pending: number;
  conflicts: number;
  coverageRate: number;
  totalHours: number;
  agentsAssigned: number;
}
