
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSchema() {
    const { supabaseAdmin } = await import('./lib/supabase-admin');
    const { data, error } = await supabaseAdmin
        .rpc('get_table_schema', { table_name: 'profiles' }); // Fallback if no RPC

    if (error) {
        // Direct query to information_schema
        const { data: columns, error: colError } = await supabaseAdmin
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'profiles');

        if (colError) {
            // Try a simple select * limit 1 to see keys
            const { data: sample, error: sampleError } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .limit(1);

            if (sampleError) {
                console.error('❌ Schema Error:', sampleError);
            } else {
                console.log('✅ Sample Keys:', Object.keys(sample[0] || {}));
            }
        } else {
            console.log('✅ Columns:', columns.map(c => c.column_name));
        }
    } else {
        console.log('✅ Schema:', data);
    }
}

checkSchema();
