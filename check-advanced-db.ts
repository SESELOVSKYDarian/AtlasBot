import { supabaseAdmin } from './lib/supabase-admin';

async function initAdvancedTables() {
    console.log("Iniciando creación de tablas avanzadas...");

    // 1. Create AI Settings table if not exists (using RPC or just trying to insert)
    // Supabase JS doesn't have a 'create table' method directly, but we can check if it exists
    // and if not, we guide the user to run the SQL.
    // However, I can try to seed the ai_settings to see if it works.

    const { error: aiError } = await supabaseAdmin
        .from('ai_settings')
        .select('key')
        .limit(1);

    if (aiError) {
        console.log("❌ La tabla 'ai_settings' no parece existir. Por favor ejecutá el SQL proporcionado.");
    } else {
        console.log("✅ Tabla 'ai_settings' detectada.");
    }

    const { error: historyError } = await supabaseAdmin
        .from('class_records')
        .select('id')
        .limit(1);

    if (historyError) {
        console.log("❌ La tabla 'class_records' no parece existir. Por favor ejecutá el SQL proporcionado.");
    } else {
        console.log("✅ Tabla 'class_records' detectada.");
    }
}

initAdvancedTables();
