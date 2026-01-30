-- Create Services Table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- Duration in minutes
  price INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own services" 
ON public.services 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add 'service_id' to appointments just in case we want to track it later (optional but good)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id);
