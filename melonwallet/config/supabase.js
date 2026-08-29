const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias no .env');
}

export const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function testarConexao() {
    try {
        const { data, error } = await supabaseClient.from('categorias').select('*');
        if (error) throw error;
        console.log('✅ Conectado à Melon Wallet!');
        console.log('Categorias carregadas:', data);
    } catch (err) {
        console.error('❌ Erro ao conectar:', err.message);
    }
}

testarConexao();
