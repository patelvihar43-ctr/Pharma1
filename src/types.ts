export type Role = 'EMPLOYEE' | 'HOD' | 'QA' | 'IT_ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  username: string;
  full_name: string;
  employee_id: string;
  department: string;
  designation: string;
  ext_no: string;
  role: Role;
}

export type RequestStatus = 
  | 'DRAFT' 
  | 'SUBMITTED_PENDING_HOD' 
  | 'APPROVED_PENDING_QA' 
  | 'APPROVED_PENDING_IT' 
  | 'COMPLETED' 
  | 'REJECTED';

export type RequestCategory = 'SAP' | 'INSTRUMENT' | 'GENERAL' | 'PASSWORD';

export interface ITRequest {
  id: number;
  user_id: number;
  employee_name: string;
  category: RequestCategory;
  status: RequestStatus;
  form_data: string;
  submission_date: string;
  last_updated: string;
  rejection_reason?: string;
  it_closure_data?: string;
}

export interface MasterData {
  id: number;
  type: 'SOFTWARE' | 'INSTRUMENT' | 'DEPARTMENT';
  value: string;
}

export interface AuditLog {
  id: number;
  request_id?: number;
  user_id: number;
  full_name: string;
  category?: string;
  action: string;
  timestamp: string;
  ip_address: string;
  justification?: string;
  details?: string;
  path?: string;
  element?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  request_id: number;
  type: 'EXPIRY_WARNING' | 'SYSTEM';
  message: string;
  timestamp: string;
  read: boolean;
}
