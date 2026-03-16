/*
  # Create Property Management System Schema

  1. New Tables
    - `portfolios`: User's property portfolios
    - `properties`: Individual properties within portfolios
    - `leases`: Lease agreements for properties
    - `cam_reconciliations`: CAM charge reconciliation records
    - `discrepancies`: Identified discrepancies in property data
    - `reports`: Generated reports
    - `exports`: Data exports

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data

  3. Indexes
    - Add indexes on user_id and portfolio_id for faster queries
*/

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create portfolios"
  ON portfolios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolios"
  ON portfolios FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
  ON portfolios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios"
  ON portfolios FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  property_type text NOT NULL DEFAULT 'office',
  year_built integer,
  total_area_sqft numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_portfolio_id ON properties(portfolio_id);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create leases table
CREATE TABLE IF NOT EXISTS leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_name text NOT NULL,
  space_type text NOT NULL,
  area_sqft numeric NOT NULL,
  lease_start date NOT NULL,
  lease_end date NOT NULL,
  annual_rent numeric NOT NULL,
  rent_type text NOT NULL DEFAULT 'triple_net',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leases_user_id ON leases(user_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create leases"
  ON leases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own leases"
  ON leases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own leases"
  ON leases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leases"
  ON leases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create CAM reconciliations table
CREATE TABLE IF NOT EXISTS cam_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  fiscal_year integer NOT NULL,
  total_cam_charges numeric NOT NULL,
  landlord_responsibility numeric NOT NULL,
  tenant_charges_total numeric NOT NULL,
  variance_amount numeric NOT NULL DEFAULT 0,
  variance_percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cam_reconciliations_user_id ON cam_reconciliations(user_id);
CREATE INDEX IF NOT EXISTS idx_cam_reconciliations_property_id ON cam_reconciliations(property_id);

ALTER TABLE cam_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create CAM reconciliations"
  ON cam_reconciliations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own CAM reconciliations"
  ON cam_reconciliations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own CAM reconciliations"
  ON cam_reconciliations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CAM reconciliations"
  ON cam_reconciliations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create discrepancies table
CREATE TABLE IF NOT EXISTS discrepancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  impact_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discrepancies_user_id ON discrepancies(user_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_property_id ON discrepancies(property_id);

ALTER TABLE discrepancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create discrepancies"
  ON discrepancies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own discrepancies"
  ON discrepancies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own discrepancies"
  ON discrepancies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own discrepancies"
  ON discrepancies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE SET NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  type text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_portfolio_id ON reports(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_reports_property_id ON reports(property_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
  ON reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create exports table
CREATE TABLE IF NOT EXISTS exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  format text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  file_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);

ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create exports"
  ON exports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own exports"
  ON exports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own exports"
  ON exports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exports"
  ON exports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
