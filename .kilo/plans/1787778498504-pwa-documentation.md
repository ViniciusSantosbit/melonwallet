# Documentação PWA — Melon Wallet

## Visão Geral

O Melon Wallet implementa um Progressive Web App (PWA) completo com:
- Web App Manifest para instalação
- Service Worker com estratégia de cache híbrida
- Banner de instalação com suporte iOS
- Fallback offline
- Notificações push (configuradas, sem backend ativo)
- Background sync (stub para implementação futura)

---

## Estrutura de Arquivos PWA

```
melonwallet/
├── manifest.json              # Configuração do app instalável
├── sw.js                      # Service Worker (cache + offline)
├── offline.html               # Página de fallback offline
├── icons/
│   ├── icon-96x96.png         # Ícone de atalho
│   ├── icon-192x192.png       # Ícone principal + push
│   └── icon-512x512.png       # Ícone de alta resolução
├── pwa/
│   ├── register-sw.js         # Módulo de registro do SW
│   └── install-banner.js      # Lógica do banner de instalação
├── index.html                 # Landing page (PWA meta tags + modal iOS)
├── dashboard.html             # Dashboard (PWA meta tags)
└── controllers/
    ├── landing.controller.js  # Inicializa PWA no landing
    └── dashboard.controller.js # Inicializa PWA no dashboard
```

---

## 1. Web App Manifest (`manifest.json`)

### Configuração

| Campo | Valor | Descrição |
|-------|-------|-----------|
| `name` | Melon Wallet | Nome completo do app |
| `short_name` | Melon | Nome curto para ícone |
| `start_url` | /index.html | URL inicial ao abrir |
| `display` | standalone | Modo standalone (sem UI do navegador) |
| `orientation` | portrait-primary | Orientação retrato |
| `background_color` | #000000 | Cor de fundo durante splash |
| `theme_color` | #000000 | Cor da barra de status |
| `scope` | / | Escopo de navegação PWA |

### Ícones

| Tamanho | Arquivo | Propósito |
|---------|---------|-----------|
| 96x96 | icon-96x96.png | any |
| 192x192 | icon-192x192.png | any maskable |
| 512x512 | icon-512x512.png | any maskable |

### Atalhos (Shortcuts)

```json
"shortcuts": [
  { "name": "Dashboard", "url": "/dashboard.html", "icons": [{ "src": "icons/icon-96x96.png" }] }
]
```

---

## 2. Service Worker (`sw.js`)

### Constantes

```js
const CACHE_NAME = 'melon-wallet-v2';
const OFFLINE_URL = '/offline.html';
```

### App Shell (Pré-cache)

Lista de 30+ assets críticos cacheados na instalação:

| Categoria | Arquivos |
|-----------|----------|
| Páginas | `/`, `/index.html`, `/dashboard.html`, `/offline.html` |
| Estilos | `/style.css` |
| Imagens | `/logo.png`, `/fundo.png` |
| Config | `/config/constants.js`, `/config/supabase.js` |
| Controllers | `/controllers/landing.controller.js`, `/controllers/dashboard.controller.js` |
| Services | `/services/auth.service.js`, `/services/simulacoes.service.js`, `/services/session.service.js` |
| Utils | `/utils/format.util.js`, `/utils/dates.util.js`, `/utils/finance.util.js` |
| Storage | `/storage/session.storage.js`, `/storage/meta.storage.js` |
| Charts | `/charts/chart-registry.js`, `/charts/bar-chart.js`, `/charts/pie-chart.js` |
| Components | `/components/loader.component.js`, `/components/modal.component.js`, `/components/metrics.component.js`, `/components/table.component.js`, `/components/goals.component.js` |
| PWA | `/pwa/register-sw.js`, `/pwa/install-banner.js` |
| CDN | `@supabase/supabase-js@2`, `chart.js`, `chartjs-plugin-datalabels@2` |

### Ciclo de Vida

#### INSTALL
- Abre cache `melon-wallet-v2`
- Cacheia todos os assets do APP_SHELL com `Promise.allSettled` (falhas de CDN não bloqueiam)
- Chama `self.skipWaiting()` para ativação imediata

#### ACTIVATE
- Remove caches antigos (diferentes de `melon-wallet-v2`)
- Chama `self.clients.claim()` para controlar todas as abas

#### FETCH (Estratégia Híbrida)

| Tipo de Requisição | Estratégia | Comportamento |
|--------------------|------------|---------------|
| POST ou `/api/` | Ignorada | Passa direto, sem interceptar |
| Supabase (hostname) | Network-First | Tenta rede, fallback para cache |
| Navegação (HTML) | Network-First | Tenta rede, fallback para cache, depois `offline.html` |
| Assets estáticos | Cache-First | Tenta cache, fallback para rede, depois SVG placeholder |

#### SYNC (Stub)
```js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-simulacoes') {
    // Placeholder para sincronização futura
  }
});
```

#### PUSH
- Exibe notificação com título/corpo customizáveis
- Ícone: `/icons/icon-192x192.png`
- Badge: `/icons/icon-72x72.png` ⚠️ ARQUIVO NÃO EXISTE
- Click abre URL da notificação ou `/dashboard.html`

### Função Auxiliar: `networkFirst(request)`

```js
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
```

---

## 3. Registro do Service Worker (`pwa/register-sw.js`)

```js
export function registerServiceWorker(logPrefix = '[PWA] SW registrado:') {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log(logPrefix, reg.scope))
            .catch((err) => console.error('[PWA] Erro:', err));
    });
}
```

### Pontos de Chamada

| Arquivo | Linha | Prefixo de Log |
|---------|-------|----------------|
| `landing.controller.js` | 135 | `[PWA] SW registrado:` |
| `dashboard.controller.js` | 424 | `[PWA] SW ativo no dashboard:` |

---

## 4. Banner de Instalação (`pwa/install-banner.js`)

### Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Botão #btn-baixar-app inicia oculto (display: none)      │
├─────────────────────────────────────────────────────────────┤
│ 2. Aguarda evento `beforeinstallprompt`                     │
│    ├─ Se disparar: armazena deferredPrompt                   │
│    └─ Exibe botão se não estiver em standalone              │
├─────────────────────────────────────────────────────────────┤
│ 3. Click no botão:                                          │
│    ├─ Se deferredPrompt existe: chama .prompt()             │
│    └─ Se iOS sem deferredPrompt: abre modal iOS             │
├─────────────────────────────────────────────────────────────┤
│ 4. Evento `appinstalled`: oculta botão, limpa deferredPrompt│
├─────────────────────────────────────────────────────────────┤
│ 5. iOS (sem beforeinstallprompt):                           │
│    ├─ Exibe botão imediatamente                             │
│    └─ Texto: "Como instalar no iPhone"                      │
└─────────────────────────────────────────────────────────────┘
```

### Detecção de iOS

```js
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
```

### Funções Globais Expostas

- `window.abrirModalIOS()` — Abre modal com instruções de instalação iOS
- `window.fecharModalIOS()` — Fecha modal

---

## 5. Modal de Instalação iOS (`index.html`)

### HTML (linhas 268-283)

```html
<div id="ios-install-modal" style="display:none;">
    <div class="ios-modal-overlay" onclick="fecharModalIOS()"></div>
    <div class="ios-modal-card">
        <button class="close-btn" onclick="fecharModalIOS()">×</button>
        <div class="ios-modal-icon">🍈</div>
        <h3>Instalar no iPhone / iPad</h3>
        <p>Siga os passos abaixo para adicionar o Melon Wallet à sua tela de início:</p>
        <ol class="ios-steps">
            <li><span class="step-icon">⬆️</span><span>Toque no botão <strong>Compartilhar</strong> no Safari</span></li>
            <li><span class="step-icon">➕</span><span>Selecione <strong>"Adicionar à Tela de Início"</strong></span></li>
            <li><span class="step-icon">✅</span><span>Toque em <strong>Adicionar</strong> no canto superior direito</span></li>
        </ol>
        <div class="ios-hint">O app abrirá em tela cheia, sem barra do navegador 🎉</div>
    </div>
</div>
```

### CSS (`style.css` linhas 880-892)

- Animação `pwaSheetUp` (slide up com cubic-bezier)
- Glassmorphism: `rgba(18,18,18,0.98)` + `backdrop-filter: blur(10px)`
- Adaptações para `body.melon-mode` e `body.light-melon-mode`

---

## 6. Página Offline (`offline.html`)

### Funcionalidade

- Exibe mensagem "Sem conexão" com emoji 🍈
- Botão de reload (`window.location.reload()`)
- Detecção automática de reconexão:

```js
window.addEventListener('online', () => {
    document.getElementById('status-msg').innerText = '✅ Conexão restaurada! Redirecionando...';
    setTimeout(() => window.location.href = '/index.html', 1500);
});

window.addEventListener('offline', () => {
    document.getElementById('status-msg').innerText = '❌ Sem internet detectada.';
});
```

---

## 7. Meta Tags PWA (HTML)

### Presentes em `index.html` e `dashboard.html`

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#000000">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Melon Wallet">
<meta name="mobile-web-app-capable" content="yes">
<link rel="apple-touch-icon" href="/icons/icon-152x152.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png">
<link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png">
```

---

## 8. Checklist PWA

| Feature | Status | Observações |
|---------|--------|-------------|
| Web App Manifest | ✅ | `standalone`, ícones, shortcuts |
| Service Worker | ✅ | install/activate/fetch/sync/push |
| Registro SW | ✅ | Chamado nos dois controllers |
| Cache Strategy | ✅ | Híbrida (cache-first + network-first) |
| Offline Fallback | ✅ | `offline.html` com detecção online/offline |
| App Shell Pre-cache | ✅ | 30+ assets |
| Install Banner | ✅ | `beforeinstallprompt` + iOS fallback |
| iOS Install Modal | ✅ | Instruções Safari passo-a-passo |
| Apple Meta Tags | ✅ | capability, status-bar, title |
| Theme Color | ✅ | `#000000` |
| Push Notifications | ✅ | Handler configurado (sem backend) |
| Background Sync | ⚠️ | Stub — sem lógica de fila offline |
| Ícone 152x152 | ❌ | Referenciado mas não existe |
| Ícone 72x72 | ❌ | Referenciado no SW mas não existe |

---

## 9. Bugs Conhecidos

### 9.1 Ícone `icon-152x152.png` não existe

**Arquivos afetados:**
- `index.html` linhas 16-18
- `dashboard.html` linhas 17-19

**Impacto:** iOS não encontrará o Apple touch icon de 152px.

**Solução:** Gerar o ícone ou remover as referências.

### 9.2 Ícone `icon-72x72.png` não existe

**Arquivo afetado:** `sw.js` linha 167

```js
badge: '/icons/icon-72x72.png'
```

**Impacto:** Badge de notificação push não será exibido.

**Solução:** Gerar o ícone ou usar um existente (ex: 96x96).

### 9.3 Background Sync sem implementação

**Arquivo:** `sw.js` linhas 154-159

O listener `sync` apenas loga mensagem. Não há fila de dados offline para sincronização.

---

## 10. Fluxo de Instalação

### Android/Desktop (Chrome)

```
1. Usuário acessa index.html
2. beforeinstallprompt é disparado
3. Botão "Baixar agora" aparece
4. Click → deferredPrompt.prompt()
5. Usuário confirma instalação
6. appinstalled → botão oculto
```

### iOS (Safari)

```
1. Usuário acessa index.html
2. iOS detectado via user agent
3. Botão "Como installer no iPhone" aparece
4. Click → abre modal com instruções
5. Usuário segue passos manualmente
```

---

## 11. Estratégia de Cache

```
┌──────────────────────────────────────────────────────────────┐
│                    FETCH EVENT                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    Sim    ┌─────────────────────────────┐  │
│  │ POST ou     │──────────→│ Ignora (passa direto)       │  │
│  │ /api/*?     │           └─────────────────────────────┘  │
│  └──────┬──────┘                                            │
│         │ Não                                                │
│         ▼                                                     │
│  ┌─────────────┐    Sim    ┌─────────────────────────────┐  │
│  │ Hostname    │──────────→│ networkFirst()              │  │
│  │ supabase?   │           │ Rede → Cache → 503 JSON     │  │
│  └──────┬──────┘           └─────────────────────────────┘  │
│         │ Não                                                │
│         ▼                                                     │
│  ┌─────────────┐    Sim    ┌─────────────────────────────┐  │
│  │ mode=       │──────────→│ fetch() → cache.put()       │  │
│  │ navigate?   │           │ catch → cache → offline.html│  │
│  └──────┬──────┘           └─────────────────────────────┘  │
│         │ Não                                                │
│         ▼                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Cache-First para assets estáticos                       ││
│  │ Cache → fetch() → cache.put() → SVG placeholder (img)   ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Dependências Externas (CDN)

Cacheadas no APP_SHELL:

| Biblioteca | URL | Uso |
|------------|-----|-----|
| Supabase JS | `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | Auth + Database |
| Chart.js | `cdn.jsdelivr.net/npm/chart.js` | Gráficos |
| Chart.js DataLabels | `cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2` | Labels nos gráficos |

---

## Referências de Arquivos

| Arquivo | Caminho Completo |
|---------|------------------|
| Service Worker | `C:\Users\kongx\OneDrive\Área de Trabalho\melonwallet\melonwallet\sw.js` |
| Manifest | `C:\Users\kongx\OneDrive\Área de Trabalho\melonwallet\melonwallet\manifest.json` |
| Register SW | `C:\Users\kongx\OneDrive\Área de Trabalho\melonwallet\melonwallet\pwa\register-sw.js` |
| Install Banner | `C:\Users\kongx\OneDrive\Área de Trabalho\melonwallet\melonwallet\pwa\install-banner.js` |
| Offline Page | `C:\Users\kongx\OneDrive\Área de Trabalho\melonwallet\melonwallet\offline.html` |
| Landing Controller | `C:\Users\kongx\OneDrive\Área de Trabalho\melonwallet\melonwallet\controllers\landing.controller.js` |
| Dashboard Controller | `C:\Users\kongx\OneDrive\Área de Trabalho\melonwallet\melonwallet\controllers\dashboard.controller.js` |
| Estilos PWA | `C:\Users\kongx\OneDrive\Área de Trabalho\melonwallet\melonwallet\style.css` (linhas 880-892, 987-989, 1514-1526, 1712-1750) |
