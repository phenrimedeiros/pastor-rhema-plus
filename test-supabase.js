#!/usr/bin/env node

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testando conexão com Supabase...\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Erro: Variáveis de ambiente não encontradas!');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Definida' : '✗ Faltando'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✓ Definida' : '✗ Faltando'}`);
  process.exit(1);
}

console.log(`✓ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
console.log(`✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    // Tentar uma query simples
    console.log('\n📡 Testando conexão com banco de dados...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' })
      .limit(0);

    if (error) {
      console.log('❌ Erro ao conectar:', error.message);
      process.exit(1);
    }

    console.log('✅ Conexão bem-sucedida com Supabase!');
    console.log(`   Tabela "profiles" está acessível`);
    process.exit(0);
  } catch (err) {
    console.log('❌ Erro:', err.message);
    process.exit(1);
  }
})();
