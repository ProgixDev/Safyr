export interface SecurityConfig {
  id: string;
  key: string;
  value: boolean | string | number;
  category:
    | "encryption"
    | "authentication"
    | "audit"
    | "backup"
    | "rgpd"
    | "api";
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface APIConnection {
  id: string;
  name: string;
  type: "rest" | "soap" | "webhook";
  endpoint: string;
  status: "connected" | "disconnected" | "error" | "pending";
  lastSync?: string;
  syncFrequency: "realtime" | "hourly" | "daily" | "weekly";
  authentication: "api_key" | "oauth" | "basic" | "none";
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export const mockSecurityConfigs: SecurityConfig[] = [];

export const mockAPIConnections: APIConnection[] = [];

export const mockAuditLogs: AuditLog[] = [];
