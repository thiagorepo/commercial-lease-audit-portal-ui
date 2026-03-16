export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  portfolio_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: 'office' | 'retail' | 'industrial' | 'multifamily' | 'other';
  year_built: number | null;
  total_area_sqft: number | null;
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: string;
  user_id: string;
  property_id: string;
  tenant_name: string;
  space_type: string;
  area_sqft: number;
  lease_start: string;
  lease_end: string;
  annual_rent: number;
  rent_type: 'triple_net' | 'modified_gross' | 'full_service' | 'other';
  status: 'active' | 'expired' | 'pending' | 'terminated';
  created_at: string;
  updated_at: string;
}

export interface CAMReconciliation {
  id: string;
  user_id: string;
  property_id: string;
  fiscal_year: number;
  total_cam_charges: number;
  landlord_responsibility: number;
  tenant_charges_total: number;
  variance_amount: number;
  variance_percentage: number;
  status: 'pending' | 'in_progress' | 'completed' | 'disputed';
  created_at: string;
  updated_at: string;
}

export interface Discrepancy {
  id: string;
  user_id: string;
  property_id: string;
  type: string;
  description: string;
  impact_amount: number;
  status: 'open' | 'in_review' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  portfolio_id: string | null;
  property_id: string | null;
  type: 'portfolio_summary' | 'property_analysis' | 'lease_audit' | 'cam_reconciliation' | 'custom';
  name: string;
  status: 'draft' | 'completed' | 'scheduled';
  created_at: string;
  updated_at: string;
}

export interface Export {
  id: string;
  user_id: string;
  type: 'csv' | 'excel' | 'pdf' | 'json';
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url: string | null;
  created_at: string;
  updated_at: string;
}
