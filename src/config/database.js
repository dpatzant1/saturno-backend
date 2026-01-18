/**
 * Configuración de conexión a Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

// Configurar zona horaria de Guatemala (UTC-6)
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-node'
    }
  }
});

/**
 * Función para verificar la conexión a la base de datos
 */
const verificarConexion = async () => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabla vacía, es OK
      throw error;
    }
    
    console.log('✅ Conexión exitosa a Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Supabase:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  verificarConexion
};
