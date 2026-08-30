import '/config/supabase.js';
import { login, register } from '/services/auth.service.js';
import { persistSession, redirectIfAuthenticated } from '/services/session.service.js';
import { initInstallBanner } from '/pwa/install-banner.js';
import { registerServiceWorker } from '/pwa/register-sw.js';
import { showMelonAlert } from '/utils/modal.util.js';

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
                await showMelonAlert('E-mail ou senha incorretos! 🍈', { type: 'error' });
            } else {
                persistSession(data);
                await showMelonAlert(`Bem-vindo de volta, ${data.nome}!`, { type: 'success' });
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            await showMelonAlert('Erro inesperado: ' + err.message, { type: 'error' });
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
                await showMelonAlert('Erro ao cadastrar: ' + error.message, { type: 'error' });
            } else {
                await showMelonAlert('Conta criada com sucesso! 🍈', { type: 'success' });
                if (data && data[0]) {
                    persistSession(data[0]);
                    window.location.href = 'dashboard.html';
                } else {
                    formCadastro.reset();
                    mostrarLogin();
                }
            }
        } catch (err) {
            await showMelonAlert('Erro inesperado: ' + err.message, { type: 'error' });
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
}

function initThemeToggle() {
    const body = document.body;
    const toggle = document.getElementById('btn-theme-toggle');
    if (!toggle) return;

    // Aplica a preferência salva (mesma chave do dashboard) assim que a página carrega
    if (localStorage.getItem('melon-theme') === 'light') {
        body.classList.add('melon-mode');
    }

    toggle.addEventListener('click', () => {
        const isLight = body.classList.toggle('melon-mode');
        localStorage.setItem('melon-theme', isLight ? 'light' : 'dark');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initLoginForm();
    initCadastroForm();
    initInstallBanner();
    initThemeToggle();
});

registerServiceWorker('[PWA] SW registrado:');

window.toggleAuth = toggleAuth;
window.mostrarLogin = mostrarLogin;
window.mostrarCadastro = mostrarCadastro;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Navbar fica mais transparente ao rolar a página
    const navbarEl = document.querySelector('.navbar');
    if (navbarEl) {
        window.addEventListener('scroll', () => {
            navbarEl.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
    }

    let width, height, targetY = 0, time = 0;
    const TWO_PI = Math.PI * 2;
    
    function resize() {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        targetY = height / 2;
    }
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        targetY = e.clientY - rect.top;
    });

    function map(v, s1, st1, s2, st2) { return s2 + (st2 - s2) * ((v - s1) / (st1 - s1)); }

    function animate() {
        requestAnimationFrame(animate);
        time += 0.005;
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(width / 2, height / 2);

        const isLightMode = document.body.classList.contains('melon-mode');
        const lineColor = isLightMode ? '38, 38, 43' : '253, 253, 150';

        const h = width / 2, i = height, f = targetY / height - 0.5;
        const lines = 30;
        
        for (let k = 0; k < lines; k++) {
            let p = time + (k / lines) * Math.PI;
            let ang = (map(k, 0, lines, 0, Math.PI) + p) % Math.PI;
            const l = (Math.tan(ang) - f) * i, a = Math.abs(l) / 2, yCenter = -i / 2 + l / 2;
            const u = i * 2, bright = Math.max(0, Math.min(255, map(Math.abs(l), 0, u, -20, 255))) / 255;
            
            if (bright <= 0) continue;
            ctx.strokeStyle = `rgba(${lineColor}, ${bright * 0.2})`;
            ctx.lineWidth = 1;
            
            if (a > 499999.5) { ctx.beginPath(); ctx.moveTo(-h, -i / 2); ctx.lineTo(h, -i / 2); ctx.stroke(); continue; }
            
            const c2 = Math.acos(Math.min(1, (h + 50) / a)), segTotal = Math.max(Math.ceil(a / 120), 200);
            const spans = [[c2, Math.PI - c2], [Math.PI + c2, TWO_PI - c2]];
            
            for (const [start, end] of spans) {
                const span = end - start, n3 = Math.max(Math.ceil((span / TWO_PI) * segTotal), 60), step = span / n3;
                ctx.beginPath();
                for (let s = 0; s <= n3; s++) {
                    const aa = start + step * s;
                    s === 0 ? ctx.moveTo(Math.cos(aa) * a, yCenter + Math.sin(aa) * a) : ctx.lineTo(Math.cos(aa) * a, yCenter + Math.sin(aa) * a);
                }
                ctx.stroke();
            }
        }
        ctx.restore();
    }
    resize();
    animate();
});

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

/* ═══════════════════════════════════════════════════════════
   3D TILT CARDS — Vanilla JS Implementation
   Baseado na lógica React com useMotionValue + useSpring
   ═══════════════════════════════════════════════════════════ */
function initTiltCards() {
    const ROTATION_RANGE = 32.5;
    const HALF_ROTATION_RANGE = ROTATION_RANGE / 2;

    // Spring simulation parameters (equivalent to useSpring)
    const SPRING_DAMPING = 20;
    const SPRING_STIFFNESS = 300;

    class SpringValue {
        constructor(initial = 0) {
            this.current = initial;
            this.target = initial;
            this.velocity = 0;
        }
        set(value) {
            this.target = value;
        }
        update(dt) {
            // Spring physics: F = -k*x - c*v
            const force = -SPRING_STIFFNESS * (this.current - this.target) - SPRING_DAMPING * this.velocity;
            this.velocity += force * dt;
            this.current += this.velocity * dt;
            // Stop when velocity is negligible
            if (Math.abs(this.velocity) < 0.001 && Math.abs(this.current - this.target) < 0.001) {
                this.current = this.target;
                this.velocity = 0;
            }
        }
        get value() {
            return this.current;
        }
    }

    function createTiltCard(card) {
        const inner = card.querySelector('.tilt-card-inner');
        const layers = card.querySelectorAll('[data-tilt-layer]');

        const rotateX = new SpringValue(0);
        const rotateY = new SpringValue(0);

        let rafId = null;
        let lastTime = 0;

        function animate(time) {
            const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
            lastTime = time;

            rotateX.update(dt);
            rotateY.update(dt);

            const rx = rotateX.value;
            const ry = rotateY.value;

            card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;

            // Move each layer based on its translateZ depth
            layers.forEach((layer) => {
                const z = parseFloat(layer.dataset.tiltLayer) || 0;
                // Parallax: layers move slightly with rotation
                const px = -ry * (z / 100) * 0.5;
                const py = rx * (z / 100) * 0.5;
                layer.style.transform = `translateZ(${z}px) translate(${px}px, ${py}px)`;
            });

            if (Math.abs(rotateX.velocity) > 0.0001 || Math.abs(rotateY.velocity) > 0.0001 ||
                Math.abs(rotateX.current - rotateX.target) > 0.001 || Math.abs(rotateY.current - rotateY.target) > 0.001) {
                rafId = requestAnimationFrame(animate);
            } else {
                rafId = null;
            }
        }

        function startAnimation() {
            if (!rafId) {
                lastTime = 0;
                rafId = requestAnimationFrame(animate);
            }
        }

        function handleMouseMove(e) {
            const rect = card.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Calculate mouse position relative to card
            const mouseX = (e.clientX - rect.left) * ROTATION_RANGE;
            const mouseY = (e.clientY - rect.top) * ROTATION_RANGE;

            // Same trigonometry as the React version
            const rX = (mouseY / height - HALF_ROTATION_RANGE) * -1;
            const rY = mouseX / width - HALF_ROTATION_RANGE;

            // Update glow position
            const glowX = ((e.clientX - rect.left) / width) * 100;
            const glowY = ((e.clientY - rect.top) / height) * 100;
            card.style.setProperty('--glow-x', `${glowX}%`);
            card.style.setProperty('--glow-y', `${glowY}%`);

            rotateX.set(rX);
            rotateY.set(rY);
            startAnimation();
        }

        function handleMouseLeave() {
            rotateX.set(0);
            rotateY.set(0);
            startAnimation();
        }

        card.addEventListener('mousemove', handleMouseMove, { passive: true });
        card.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    // Initialize all tilt cards
    document.querySelectorAll('[data-tilt-card]').forEach(createTiltCard);
}

// Inicializa cards tilt quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTiltCards);
} else {
    initTiltCards();
}