-- Create captcha_sessions table to store active captcha challenges
CREATE TABLE public.captcha_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  question TEXT NOT NULL,
  answer INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.captcha_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read captcha sessions (needed for verification)
CREATE POLICY "Anyone can read captcha sessions" 
ON public.captcha_sessions 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to create captcha sessions
CREATE POLICY "Anyone can create captcha sessions" 
ON public.captcha_sessions 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow anyone to update captcha sessions (for verification)
CREATE POLICY "Anyone can update captcha sessions" 
ON public.captcha_sessions 
FOR UPDATE 
USING (true);

-- Create function to clean up expired captcha sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_captcha_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.captcha_sessions 
  WHERE expires_at < now();
END;
$$;

-- Create index for performance
CREATE INDEX idx_captcha_sessions_session_id ON public.captcha_sessions(session_id);
CREATE INDEX idx_captcha_sessions_expires_at ON public.captcha_sessions(expires_at);