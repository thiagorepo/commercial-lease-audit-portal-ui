/*
  # Add new lease fields for CDL alignment

  1. Changes to leases table
    - Add `start_date` column (replacing termStart)
    - Add `end_date` column (replacing termEnd)
    - Add `cam_cap_percent` column (replacing escalationRate)

  2. Data Migration
    - These are new columns being added to the schema
    - Existing mock data will use these new field names

  3. Notes
    - These columns provide better alignment with the CDL specification
    - Application code will be updated to use these new column names
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE leases ADD COLUMN start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE leases ADD COLUMN end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'cam_cap_percent'
  ) THEN
    ALTER TABLE leases ADD COLUMN cam_cap_percent numeric;
  END IF;
END $$;
