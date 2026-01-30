
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listProfiles() {
    const { supabaseAdmin } = await import('./lib/supabase-admin');
    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role, business_name');

    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('--- ALL PROFILES ---');
        profiles?.forEach(p => {
            console.log(`ID: ${p.id} | Email: ${p.email} | Role: ${p.role}`);
        });
        console.log('--- END ---');
    }
}

listProfiles();
