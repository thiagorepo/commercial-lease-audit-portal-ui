export type LeaseStatus = 'active' | 'expired' | 'pending' | 'terminated';
export type CAMType = 'gross' | 'net' | 'modified-gross' | 'triple-net' | 'base-year';
export type DiscrepancyCategory = 'rent-overcharge' | 'cam-overcharge' | 'late-fee' | 'error' | 'other';
export type DiscrepancyStatus = 'open' | 'pending' | 'resolved' | 'recovered' | 'dismissed' | 'false-positive';
export type DiscrepancyPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CAMStatus = 'draft' | 'submitted' | 'approved' | 'finalized' | 'rejected';
export type ReportStatus = 'draft' | 'reviewed' | 'final' | 'distributed' | 'archived';
export type ReportType = 'portfolio-summary' | 'lease-specific' | 'cam-audit' | 'annual-review';
export type UserRole = 'admin' | 'auditor' | 'viewer';
export type UserStatus = 'active' | 'inactive';
export type DocumentType = 'lease' | 'amendment' | 'renewal' | 'sublease' | 'invoice' | 'report' | 'other';
export type EventType = 'renewal' | 'escalation' | 'expiration' | 'deadline' | 'audit';

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  propertyCount: number;
  leaseCount: number;
  totalSqFt: number;
  createdAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  portfolioId: string;
  portfolioName: string;
  leaseCount: number;
  totalSqFt: number;
  occupancyRate: number;
  imageUrl?: string;
}

export interface Lease {
  id: string;
  leaseNumber: string;
  tenantName: string;
  tenantContact: string;
  tenantPhone: string;
  tenantEmail: string;
  tenantAddress: string;
  propertyId: string;
  propertyName: string;
  portfolioId: string;
  portfolioName: string;
  status: LeaseStatus;
  camType: CAMType;
  termStart: string;
  termEnd: string;
  baseRent: number;
  squareFootage: number;
  renewalOption: boolean;
  escalationRate: number;
  openDiscrepancies: number;
  totalInvoiced: number;
  totalAudited: number;
  potentialRecovery: number;
  currency_code: string;
  version: number;
  createdAt: string;
}

export interface Discrepancy {
  id: string;
  leaseId: string;
  leaseNumber: string;
  tenantName: string;
  propertyName: string;
  category: DiscrepancyCategory;
  description: string;
  expectedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  priority: DiscrepancyPriority;
  status: DiscrepancyStatus;
  assignedTo: string;
  assignedToAvatar?: string;
  recoveredAmount?: number;
  recoveryDate?: string;
  recoveryNotes?: string;
  notes: Comment[];
  statusHistory: StatusHistoryEntry[];
  relatedDocuments: string[];
  currency_code: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface StatusHistoryEntry {
  status: string;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface CAMItem {
  id: string;
  category: string;
  description: string;
  totalAmount: number;
  tenantSharePercent: number;
  tenantDollarAmount: number;
  isPassThrough: boolean;
  capPercent?: number;
  capAmount?: number;
}

export interface CAMReconciliation {
  id: string;
  leaseId: string;
  leaseNumber: string;
  tenantName: string;
  propertyName: string;
  fiscalYear: number;
  camType: CAMType;
  status: CAMStatus;
  totalExpenses: number;
  proRataSharePercent: number;
  amountBilled: number;
  variance: number;
  capPercent?: number;
  baseYear?: number;
  items: CAMItem[];
  exclusions: string[];
  createdBy: string;
  createdAt: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  finalizedBy?: string;
  finalizedAt?: string;
}

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  status: ReportStatus;
  portfolioId?: string;
  portfolioName?: string;
  leaseId?: string;
  leaseName?: string;
  periodStart: string;
  periodEnd: string;
  discrepancyCount: number;
  recoveryAmount: number;
  version: number;
  createdBy: string;
  createdAt: string;
  executiveSummary: string;
  findings: string[];
  recommendations: string[];
  methodology: string;
  appendix: string[];
  comments: Comment[];
  statusHistory: StatusHistoryEntry[];
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  leaseId?: string;
  url?: string;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;
  leaseId: string;
  leaseNumber: string;
  tenantName: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  leaseCount: number;
}

export interface Invoice {
  id: string;
  leaseId: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'disputed';
  description: string;
}

export interface Export {
  id: string;
  name: string;
  type: string;
  format: 'pdf' | 'excel' | 'csv';
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  fileSize?: string;
}
