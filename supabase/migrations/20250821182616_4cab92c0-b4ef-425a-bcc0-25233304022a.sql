-- Add foreign key constraint between incidents and profiles tables
ALTER TABLE public.incidents 
ADD CONSTRAINT fk_incidents_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);