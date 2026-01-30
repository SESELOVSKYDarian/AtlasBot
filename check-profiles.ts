
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkProfiles() {
    const { supabaseAdmin } = await import('./lib/supabase-admin');
    const email = 'vasescompany912@gmail.com';

    console.log('--- Checking profiles table directly ---');
    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email);

    if (error) {
        console.error('❌ Error querying profiles:', error);
    } else {
        console.log('✅ Profiles found:', JSON.stringify(profiles, null, 2));
    }

    console.log('--- Checking auth.users specifically ---');
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const user = authData.users.find(u => u.email === email);
    if (user) {
        console.log('✅ Auth User ID:', user.id);
    } else {
        console.log('❌ Auth User NOT FOUND');
    }
}

checkProfiles();
