-- Drop the existing foreign key constraint to auth.users
ALTER TABLE public.incident_reports 
DROP CONSTRAINT IF EXISTS incident_reports_user_id_fkey;

-- Add foreign key constraint to profiles table instead
-- First ensure all existing records have corresponding profiles
INSERT INTO public.profiles (user_id, full_name, role)
SELECT DISTINCT ir.user_id, '', 'user'
FROM public.incident_reports ir
LEFT JOIN public.profiles p ON ir.user_id = p.user_id
WHERE p.user_id IS NULL;

-- Now add the foreign key constraint
ALTER TABLE public.incident_reports
ADD CONSTRAINT incident_reports_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;