
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkQR() {
    console.log('🔍 Checking QR Code in Supabase...');

    // Dynamic import to ensure env vars are loaded
    const { supabaseAdmin } = await import('./lib/supabase-admin');

    const { data, error } = await supabaseAdmin
        .from('system_status')
        .select('*');

    if (error) {
        console.error('❌ Error fetching system_status:', error);
    } else {
        console.log('✅ Current System Status:');
        console.log(JSON.stringify(data, null, 2));
    }
}

checkQR();
