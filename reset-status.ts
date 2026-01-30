import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('🧹 Reseting bot status to disconnected...');

    await supabase.from('system_status').upsert({ key: 'bot_status', value: JSON.stringify('disconnected') });
    await supabase.from('system_status').upsert({ key: 'qr_code', value: JSON.stringify('') });

    console.log('✅ Done.');
}

cleanup();
