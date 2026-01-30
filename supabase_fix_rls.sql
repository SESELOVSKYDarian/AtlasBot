-- FIX SECURITY FOR ai_settings TABLE

-- 1. Enable Row Level Security (RLS)
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Users can view their own AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Users can insert their own AI settings" ON public.ai_settings;
DROP POLICY IF EXISTS "Users can update their own AI settings" ON public.ai_settings;

-- 3. Create comprehensive policies
-- Allow users to SELECT their own settings
CREATE POLICY "Users can view their own AI settings" 
ON public.ai_settings FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to INSERT their own settings
CREATE POLICY "Users can insert their own AI settings" 
ON public.ai_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own settings
CREATE POLICY "Users can update their own AI settings" 
ON public.ai_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to DELETE their own settings
CREATE POLICY "Users can delete their own AI settings" 
ON public.ai_settings FOR DELETE 
USING (auth.uid() = user_id);
