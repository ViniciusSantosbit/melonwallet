// sw.js — Service Worker do Melon Wallet
// Estratégia: Cache-First para assets estáticos, Network-First para dados do Supabase

const CACHE_NAME = 'melon-wallet-v1';
const OFFLINE_URL = '/offline.html';

// Arquivos que serão cacheados na instalação (App Shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/style.css',
  '/conexao/auth.js',
  '/conexao/dashboard.js',
  '/conexao/conexao.js',
  '/logo.png',
  '/fundo.png',
  '/offline.html',
  // CDNs essenciais
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2'
];

// ─── INSTALAÇÃO: pré-cacheia o App Shell ───────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Melon Wallet v1...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando App Shell');
      // Usa addAll com tratamento individual para não falhar se CDN offline
      return Promise.allSettled(
        APP_SHELL.map(url => cache.add(url).catch(err => {
          console.warn(`[SW] Não cacheou: ${url}`, err);
        }))
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── ATIVAÇÃO: limpa caches antigos ───────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando nova versão...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH: estratégia híbrida ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Requisições ao Supabase → sempre Network-First (dados em tempo real)
  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 2. Navegação (HTML) → Network-First com fallback para offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Atualiza o cache com a resposta mais recente
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => 
          caches.match(request).then(cached => 
            cached || caches.match(OFFLINE_URL)
          )
        )
    );
    return;
  }

  // 3. Assets estáticos (CSS, JS, imagens) → Cache-First
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      // Não está no cache: busca na rede e armazena
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => {
        // Fallback para imagens
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text y="30" font-size="30">🍈</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});

// ─── HELPERS ──────────────────────────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const clone = response.clone();
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, clone);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(
      JSON.stringify({ error: 'Offline — dados em cache podem estar desatualizados.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ─── SINCRONIZAÇÃO EM BACKGROUND (quando volta online) ────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-simulacoes') {
    console.log('[SW] Sincronizando dados pendentes...');
    // Aqui você pode implementar envio de dados offline futuramente
  }
});

// ─── NOTIFICAÇÕES PUSH (base para uso futuro) ─────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  self.registration.showNotification(data.title || 'Melon Wallet', {
    body: data.body || 'Você tem novidades no seu patrimônio!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: data.url || '/dashboard.html' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/dashboard.html')
  );
});