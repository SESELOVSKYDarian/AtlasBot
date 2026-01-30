-- Create a table to store system status (QR code, Bot Status)
CREATE TABLE system_status (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default records
INSERT INTO system_status (key, value) VALUES 
('qr_code', '"waiting"'),
('bot_status', '"disconnected"')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS (Optional for now, but good practice)
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;

-- Allow public read (for admin dashboard) - restrictive write (only service role)
CREATE POLICY "Allow public read" ON system_status FOR SELECT USING (true);
-- Write policy logic handled by service role key mostly
