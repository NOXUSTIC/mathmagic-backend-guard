-- Create incident_reports table for user submissions
CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  district TEXT,
  incident_type TEXT NOT NULL,
  urgency_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  latitude NUMERIC,
  longitude NUMERIC,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for incident_reports
CREATE POLICY "Anyone can view incident reports" 
ON public.incident_reports 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own incident reports" 
ON public.incident_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incident reports" 
ON public.incident_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any incident report" 
ON public.incident_reports 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_incident_reports_updated_at
BEFORE UPDATE ON public.incident_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();