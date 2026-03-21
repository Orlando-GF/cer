import { createClient } from './src/utils/supabase/server.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fila_espera')
    .select('id, faltas_consecutivas')
    .limit(1);
    
  if (error) {
    console.error("ERRO SUPABASE:", error);
  } else {
    console.log("SUCESSO MÁGICO SUPABASE:", data);
  }
}

run();
