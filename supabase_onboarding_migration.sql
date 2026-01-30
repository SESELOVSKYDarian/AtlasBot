-- 1. Extender perfiles de usuario con soporte para Verificación Manual
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  business_type TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified_custom BOOLEAN DEFAULT FALSE,
  preferred_language TEXT DEFAULT 'es',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existía, añadimos las nuevas columnas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_custom BOOLEAN DEFAULT FALSE;

-- 2. Tabla para Códigos de Verificación (OTPs)
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'phone')),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Políticas de perfiles
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Los usuarios pueden insertar su propio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas de códigos (Solo el usuario puede ver sus códigos si fuese necesario, 
-- aunque usualmente esto lo maneja Service Role en backend. Para fines de demo, permitimos select)
CREATE POLICY "Usuarios ven sus propios códigos" ON public.verification_codes FOR SELECT USING (auth.uid() = user_id);

-- 4. Trigger para perfil automático
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Tabla ai_settings (Multiusuario)
CREATE TABLE IF NOT EXISTS public.ai_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, key)
);

-- Migración segura para tablas existentes:
DO $$ 
BEGIN 
    -- Intentar dropear el PK viejo si existe (usualmente se llama ai_settings_pkey)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_settings_pkey') THEN
        ALTER TABLE public.ai_settings DROP CONSTRAINT ai_settings_pkey;
        ALTER TABLE public.ai_settings ADD PRIMARY KEY (user_id, key);
    END IF;
END $$;
