import express from 'express';
import webpush from 'web-push';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const VAPID_FILE = join(__dirname, 'vapid-keys.json');
const SUBSCRIPTIONS_FILE = join(__dirname, 'subscriptions.json');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

function getVapidKeys() {
    if (existsSync(VAPID_FILE)) {
        return JSON.parse(readFileSync(VAPID_FILE, 'utf8'));
    }
    const keys = webpush.generateVAPIDKeys();
    writeFileSync(VAPID_FILE, JSON.stringify(keys, null, 2));
    console.log('[VAPID] Novas chaves geradas e salvas');
    return keys;
}

const vapidKeys = getVapidKeys();
webpush.setVAPIDDetails(
    'mailto:contato@melonwallet.app',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
console.log('[VAPID] Chaves configuradas:', vapidKeys.publicKey.slice(0, 20) + '...');

function loadSubscriptions() {
    if (!existsSync(SUBSCRIPTIONS_FILE)) return [];
    try {
        return JSON.parse(readFileSync(SUBSCRIPTIONS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function saveSubscriptions(subscriptions) {
    writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
}

app.get('/api/notifications/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/notifications/subscribe', (req, res) => {
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Subscription inválida' });
    }

    const subscriptions = loadSubscriptions();
    const existingIndex = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);

    const subscriptionData = {
        ...subscription,
        userId: req.headers['x-user-id'] || null,
        createdAt: existingIndex >= 0 ? subscriptions[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        subscriptions[existingIndex] = subscriptionData;
        console.log('[Push] Subscription atualizada:', subscription.endpoint.slice(0, 40));
    } else {
        subscriptions.push(subscriptionData);
        console.log('[Push] Nova subscription registrada:', subscription.endpoint.slice(0, 40));
    }

    saveSubscriptions(subscriptions);
    res.json({ success: true, message: 'Inscrição registrada' });
});

app.post('/api/notifications/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint obrigatório' });
    }

    const subscriptions = loadSubscriptions();
    const filtered = subscriptions.filter(s => s.endpoint !== endpoint);
    saveSubscriptions(filtered);

    console.log('[Push] Subscription removida:', endpoint.slice(0, 40));
    res.json({ success: true, message: 'Inscrição removida' });
});

app.post('/api/notifications/test', async (req, res) => {
    const { title, body, url } = req.body;

    const subscriptions = loadSubscriptions();
    if (subscriptions.length === 0) {
        return res.status(400).json({ error: 'Nenhuma inscrição ativa' });
    }

    const payload = JSON.stringify({
        title: title || 'Melon Wallet',
        body: body || 'Notificação de teste',
        url: url || '/dashboard.html',
        tag: 'test-notification'
    });

    const results = await Promise.allSettled(
        subscriptions.map(sub =>
            webpush.sendNotification(sub, payload).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    return { expired: true, endpoint: sub.endpoint };
                }
                throw err;
            })
        )
    );

    const expired = results
        .filter(r => r.status === 'fulfilled' && r.value?.expired)
        .map(r => r.value.endpoint);

    if (expired.length > 0) {
        const active = subscriptions.filter(s => !expired.includes(s.endpoint));
        saveSubscriptions(active);
        console.log(`[Push] ${expired.length} subscriptions expiradas removidas`);
    }

    res.json({
        success: true,
        sent: results.filter(r => r.status === 'fulfilled' && !r.value?.expired).length,
        expired: expired.length
    });
});

app.post('/api/notifications/process', async (req, res) => {
    try {
        const { processAndSendNotifications } = await import('./services/notifications.service.js');
        const result = await processAndSendNotifications();
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[API] Erro no processamento:', err);
        res.status(500).json({ error: 'Erro ao processar notificações' });
    }
});

app.listen(PORT, () => {
    console.log(`[Server] Melon Wallet Push Server rodando na porta ${PORT}`);
    console.log(`[Server] VAPID Public Key: ${vapidKeys.publicKey}`);
});

export { vapidKeys, loadSubscriptions, saveSubscriptions };
