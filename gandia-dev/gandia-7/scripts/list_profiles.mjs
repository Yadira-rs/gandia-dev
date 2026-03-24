import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no encontradas en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listProfiles() {
  console.log('--- Consultando user_profiles en Supabase ---');
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, role, personal_data, institutional_data');

  if (error) {
    console.error('Error al consultar:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No se encontraron perfiles en la tabla user_profiles.');
    return;
  }

  console.log(`Se encontraron ${data.length} perfiles:\n`);
  
  data.forEach((p, i) => {
    const pData = p.personal_data || {};
    const iData = p.institutional_data || {};
    
    console.log(`[${i + 1}] ID: ${p.user_id}`);
    console.log(`    Rol: ${p.role}`);
    console.log(`    Nombre Personal: ${pData.full_name || pData.nombre || 'N/A'}`);
    console.log(`    Razon Social: ${iData.razon_social || 'N/A'}`);
    console.log(`    Institución: ${iData.nombre_institucion || 'N/A'}`);
    console.log(`    Empresa: ${iData.empresa || 'N/A'}`);
    console.log('-------------------------------------------');
  });
}

listProfiles();
