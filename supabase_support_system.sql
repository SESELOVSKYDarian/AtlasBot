-- 1. Actualizar perfiles con Roles y Planes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'business' CHECK (role IN ('super_admin', 'support', 'business'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'plan') THEN
        ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise'));
    END IF;
END $$;

-- 2. Sistema de Tickets de Soporte
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    assigned_to_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'waiting', 'resolved', 'closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    subject TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mensajes de Soporte (Chat en Vivo)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_bot BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Base de Conocimiento de Soporte (Global)
CREATE TABLE IF NOT EXISTS public.support_kb (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_kb ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de RLS para Tickets
-- Los usuarios pueden ver e insertar sus propios tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los roles de soporte y super admins pueden ver todos los tickets
CREATE POLICY "Support and admins can view all tickets" ON public.support_tickets FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'support' OR role = 'super_admin')
    )
);

-- Soporte y admins pueden actualizar tickets (asignar, cerrar)
CREATE POLICY "Support and admins can update all tickets" ON public.support_tickets FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'support' OR role = 'super_admin')
    )
);

-- 7. Políticas de RLS para Mensajes
CREATE POLICY "Users can view messages of their own tickets" ON public.support_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = ticket_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert messages to their own tickets" ON public.support_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = ticket_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Support and admins can view and insert messages" ON public.support_messages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'support' OR role = 'super_admin')
    )
);

-- 8. Políticas de RLS para KB (Todo el mundo lee, solo admins editan)
CREATE POLICY "Anyone can read support KB" ON public.support_kb FOR SELECT USING (true);
CREATE POLICY "Admins can manage KB" ON public.support_kb FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- 9. Habilitar Realtime (Esto se suele hacer vía SQL en Supabase)
-- NOTA: Requiere que la publicación 'supabase_realtime' incluya estas tablas.
-- ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
