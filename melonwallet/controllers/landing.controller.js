import '../config/supabase.js';
import { login, register } from '../services/auth.service.js';
import { persistSession, redirectIfAuthenticated } from '../services/session.service.js';
import { initInstallBanner } from '../pwa/install-banner.js';
import { registerServiceWorker } from '../pwa/register-sw.js';

redirectIfAuthenticated();

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

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (entry.target.classList.contains('mockup-container')) {
                    entry.target.classList.add('animate-chart');
                }
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

function initLoginForm() {
    const formLogin = document.getElementById('formLogin');
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.submitter;
        const originalText = btn.innerText;
        btn.innerText = 'Entrando...';
        btn.disabled = true;

        const email = document.getElementById('emailLogin').value;
        const senha = document.getElementById('senhaLogin').value;

        try {
            const { data, error } = await login(email, senha);

            if (error || !data) {
                alert('E-mail ou senha incorretos! 🍈');
            } else {
                persistSession(data);
                alert(`Bem-vindo de volta, ${data.nome}!`);
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            alert('Erro inesperado: ' + err.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}

function initCadastroForm() {
    const formCadastro = document.getElementById('formCadastro');
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.submitter;
        const originalText = btn.innerText;
        btn.innerText = 'Criando conta...';
        btn.disabled = true;

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const { data, error } = await register({ nome, email, senha });

            if (error) {
                alert('Erro ao cadastrar: ' + error.message);
            } else {
                alert('Conta criada com sucesso! 🍈');
                if (data && data[0]) {
                    persistSession(data[0]);
                    window.location.href = 'dashboard.html';
                } else {
                    formCadastro.reset();
                    mostrarLogin();
                }
            }
        } catch (err) {
            alert('Erro inesperado: ' + err.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initLoginForm();
    initCadastroForm();
    initInstallBanner();
});

registerServiceWorker('[PWA] SW registrado:');

window.toggleAuth = toggleAuth;
window.mostrarLogin = mostrarLogin;
window.mostrarCadastro = mostrarCadastro;
