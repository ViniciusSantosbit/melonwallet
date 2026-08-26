# Push Notifications — Melon Wallet

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                       │
├─────────────────────────────────────────────────────────────────┤
│  pwa/register-sw.js                                             │
│  ├─ requestNotificationPermission()                             │
│  ├─ subscribeToPushNotifications()                              │
│  ├─ unsubscribeFromPushNotifications()                          │
│  └─ getPushSubscriptionStatus()                                 │
├─────────────────────────────────────────────────────────────────┤
│  sw.js (Service Worker)                                         │
│  ├─ self.addEventListener('push', ...)                          │
│  └─ self.addEventListener('notificationclick', ...)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API EDGE FUNCTIONS (Vercel)                   │
├─────────────────────────────────────────────────────────────────┤
│  api/notifications/vapid-public-key.js  → GET  (chave pública)  │
│  api/notifications/subscribe.js         → POST (salvar sub)     │
│  api/notifications/unsubscribe.js       → POST (remover sub)    │
│  api/notifications/send-test.js         → POST (teste)          │
│  api/notifications/process.js           → POST (cron job)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                    │
├─────────────────────────────────────────────────────────────────┤
│  server.js                                                        │
│  ├─ GET  /api/notifications/vapid-public-key                    │
│  ├─ POST /api/notifications/subscribe                           │
│  ├─ POST /api/notifications/unsubscribe                         │
│  ├─ POST /api/notifications/test                                │
│  └─ POST /api/notifications/process                             │
├─────────────────────────────────────────────────────────────────┤
│  services/notifications.service.js                               │
│  ├─ sendAccumulatedTrackingNotification()  (Regra 1)            │
│  ├─ sendWeeklySummaryNotification()       (Regra 2)            │
│  ├─ generateAIAnalysis()                  (Gemini)             │
│  └─ processAndSendNotifications()         (batch)               │
└─────────────────────────────────────────────────────────────────┘
```

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

### 3. Gerar chaves VAPID

Ao rodar o servidor pela primeira vez, as chaves são geradas automaticamente:

```bash
npm run server
```

Saída:
```
[VAPID] Novas chaves geradas e salvas
[VAPID] Chaves configuradas: BH9J6Igqlx2xckxC7RHE...
[Server] Melon Wallet Push Server rodando na porta 3001
[Server] VAPID Public Key: BH9J6Igqlx2xckxC7RHEMB3sO3cF3x9dRqSe1LxNMXs7kxjQ5R9JW0DQs0NkB0Y5d2xYHmLqXvY6j6v7aE3dFqg
```

### 4. Atualizar chave pública no frontend

Edite `pwa/register-sw.js` e substitua `VAPID_PUBLIC_KEY`:

```javascript
const VAPID_PUBLIC_KEY = 'sua-chave-publica-aqui';
```

## Regras de Negócio

### Regra 1: Rastreamento Acumulado

Calcula meses desde o início da assinatura e total gasto:

```
Entrada: { serviceName: "iFood Clube", monthlyPrice: 19.90, startDate: "2024-01-15" }
Saída: "Você assina o iFood Clube há 6 meses e já gastou R$ 119.40. Toque para ver a análise."
```

### Regra 2: Resumo Semanal

Identifica assinaturas que renovam nos próximos 7 dias:

```
Entrada: subscriptions com renewalDay nos próximos 7 dias
Saída: "Netflix e Spotify renovam nesta semana (R$ 75.00). Tudo certo por aí?"
```

### Integração com IA (Gemini)

As mensagens podem ser geradas dinamicamente pela IA quando `GEMINI_API_KEY` está configurada.

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/notifications/vapid-public-key` | Retorna chave pública VAPID |
| POST | `/api/notifications/subscribe` | Salva subscription do navegador |
| POST | `/api/notifications/unsubscribe` | Remove subscription |
| POST | `/api/notifications/test` | Envia notificação de teste |
| POST | `/api/notifications/process` | Processa e envia notificações (cron) |

## Cron Job (Automação)

Configure um cron job para chamar periodicamente:

```bash
# Diariamente às 9h
0 9 * * * curl -X POST https://seu-dominio.com/api/notifications/process \
  -H "Authorization: Bearer seu-secreto-aqui"
```

## Uso no Frontend

```javascript
import { subscribeToPushNotifications } from './pwa/register-sw.js';

// Solicitar permissão e inscrever
const result = await subscribeToPushNotifications();
if (result.success) {
    console.log('Inscrito para notificações push!');
}

// Verificar status
const status = await getPushSubscriptionStatus();
console.log('Inscrito:', status.subscribed);
```

## Arquivos Modificados/Criados

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `sw.js` | ✅ Atualizado | Push event dinâmico + badge corrigido |
| `pwa/register-sw.js` | ✅ Atualizado | Funções de permissão e subscription |
| `server.js` | ✅ Novo | Backend Node.js com web-push |
| `services/notifications.service.js` | ✅ Novo | Lógica de negócio + IA |
| `api/notifications/*.js` | ✅ Novos | Edge Functions (Vercel) |
| `package.json` | ✅ Atualizado | Dependências web-push, express, cors |
| `.env.example` | ✅ Novo | Documentação de variáveis |
| `.gitignore` | ✅ Novo | Proteção de chaves |
