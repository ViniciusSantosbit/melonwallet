// conexao/conexao.js

const SUPABASE_URL = 'https://kffrtelbeqpgiakgsehu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZnJ0ZWxiZXFwZ2lha2dzZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDc3MjAsImV4cCI6MjA5MjAyMzcyMH0.DoUtb4aCl1l1FizbjPpWYCGlNRjHAtL5zjQjNcIRIy8';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para testar se funcionou
async function testarConexao() {
    try {
        const { data, error } = await _supabase.from('categorias').select('*');
        if (error) throw error;
        console.log("✅ Conectado à Melon Wallet!");
        console.log("Categorias carregadas:", data);
    } catch (err) {
        console.error("❌ Erro ao conectar:", err.message);
    }
}

testarConexao();