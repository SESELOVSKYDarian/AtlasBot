
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkUserById() {
    const { supabaseAdmin } = await import('./lib/supabase-admin');
    const email = 'vasescompany912@gmail.com';

    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const user = authData.users.find(u => u.email === email);

    if (!user) {
        console.log('AUTH_USER_NOT_FOUND');
        return;
    }

    console.log('✅ Auth User found:', user.id);

    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('❌ Profile Error:', error.message);
    } else {
        console.log('✅ Profile found:');
        console.log(`ID: ${profile.id}`);
        console.log(`Role: ${profile.role}`);
        console.log(`Business: ${profile.business_name}`);
    }
}

checkUserById();
