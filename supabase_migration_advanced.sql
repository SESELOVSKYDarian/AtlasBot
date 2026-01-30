-- Create AI Settings table
CREATE TABLE IF NOT EXISTS ai_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default AI settings
INSERT INTO ai_settings (key, value)
VALUES (
    'config',
    '{
        "system_prompt": "Eres un asistente virtual experto en fitness y entrenamiento personal. Tu objetivo es ayudar a los clientes a reservar turnos, responder dudas sobre servicios y precios, y motivarlos en su entrenamiento.",
        "temperature": 0.7,
        "knowledge_base": {
            "services": ["Personal Training 1 a 1", "Online Coaching", "Nutrición"],
            "prices": {
                "individual": "15000",
                "monthly_pack": "50000"
            }
        }
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Create Class Records table (Historia Clínica)
CREATE TABLE IF NOT EXISTS class_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    notes TEXT,
    exercises JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE ai_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE class_records;
