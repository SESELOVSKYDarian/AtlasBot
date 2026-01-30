
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkUser() {
    const { supabaseAdmin } = await import('./lib/supabase-admin');
    const email = 'vasescompany912@gmail.com';

    const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
    const user = authUser.users.find(u => u.email === email);

    if (!user) {
        console.log('USER_NOT_FOUND');
        return;
    }

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role, business_name')
        .eq('id', user.id)
        .single();

    if (!profile) {
        console.log('PROFILE_NOT_FOUND');
    } else {
        console.log('USER_ID:', profile.id);
        console.log('USER_EMAIL:', profile.email);
        console.log('USER_ROLE:', profile.role);
    }
}

checkUser();
