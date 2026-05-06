// conexao/auth.js

// ═══ TAREFA 3: PERSISTÊNCIA DE LOGIN ═══
// Verifica se já existe sessão salva e redireciona direto para o dashboard
(function verificarSessao() {
    const userId = localStorage.getItem('melon_user_id');
    if (userId) {
        window.location.href = 'dashboard.html';
    }
})();
// ═══════════════════════════════════════

// --- 1. ALTERNÂNCIA LOGIN <-> CADASTRO ---
function toggleAuth() {
    const loginSec = document.getElementById('auth-login');
    if (loginSec.style.display === 'none') mostrarLogin();
    else mostrarCadastro();
}

function mostrarLogin() {
    document.getElementById('auth-login').style.display = 'block';
    document.getElementById('auth-cadastro').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarCadastro() {
    document.getElementById('auth-login').style.display = 'none';
    document.getElementById('auth-cadastro').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 2. LOGIN ---
const formLogin = document.getElementById('formLogin');
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const originalText = btn.innerText;
    btn.innerText = "Entrando...";
    btn.disabled = true;

    const email = document.getElementById('emailLogin').value;
    const senha = document.getElementById('senhaLogin').value;

    try {
        const { data, error } = await _supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .eq('senha', senha)
            .single();

        if (error || !data) {
            alert("E-mail ou senha incorretos! 🍈");
        } else {
            // ═══ TAREFA 3: Salva sessão permanente no localStorage ═══
            localStorage.setItem('melon_user_id', data.id);
            localStorage.setItem('melon_user_nome', data.nome);
            // ═══════════════════════════════════════════════════════
            alert(`Bem-vindo de volta, ${data.nome}!`);
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        alert("Erro inesperado: " + err.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

// --- 3. CADASTRO ---
const formCadastro = document.getElementById('formCadastro');
formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const originalText = btn.innerText;
    btn.innerText = "Criando conta...";
    btn.disabled = true;

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const { data, error } = await _supabase
            .from('usuarios')
            .insert([{ nome, email, senha }])
            .select();

        if (error) {
            alert("Erro ao cadastrar: " + error.message);
        } else {
            alert("Conta criada com sucesso! 🍈");
            if (data && data[0]) {
                // ═══ TAREFA 3: Salva sessão permanente após cadastro ═══
                localStorage.setItem('melon_user_id', data[0].id);
                localStorage.setItem('melon_user_nome', data[0].nome);
                // ═══════════════════════════════════════════════════════
                window.location.href = 'dashboard.html';
            } else {
                formCadastro.reset();
                mostrarLogin();
            }
        }
    } catch (err) {
        alert("Erro inesperado: " + err.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

// --- 4. SCROLL REVEAL ---
const revealElements = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (entry.target.classList.contains('mockup-container')) {
                    entry.target.classList.add('animate-chart');
                }
            }
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
};

document.addEventListener('DOMContentLoaded', revealElements);