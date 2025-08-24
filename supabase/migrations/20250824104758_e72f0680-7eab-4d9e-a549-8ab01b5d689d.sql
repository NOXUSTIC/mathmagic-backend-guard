-- Add foreign key constraint to incident_reports table
ALTER TABLE public.incident_reports 
ADD CONSTRAINT incident_reports_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add check constraints for urgency_level and status
ALTER TABLE public.incident_reports 
ADD CONSTRAINT incident_reports_urgency_check 
CHECK (urgency_level IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE public.incident_reports 
ADD CONSTRAINT incident_reports_status_check 
CHECK (status IN ('pending', 'in_progress', 'resolved'));