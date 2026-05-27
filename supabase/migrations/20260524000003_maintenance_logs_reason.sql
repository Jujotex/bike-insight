-- Add reason column to maintenance_logs
-- Values: usure (normal wear), crevaison (puncture), casse (breakage), anticipé (anticipated/preventive)
ALTER TABLE maintenance_logs
  ADD COLUMN IF NOT EXISTS reason text CHECK (reason IN ('usure', 'crevaison', 'casse', 'anticipé'));
