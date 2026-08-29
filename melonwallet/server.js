import express from 'express';
import 'dotenv/config';
import webpush from 'web-push';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
    listarPushSubscriptions,
    salvarPushSubscription,
    removerPushSubscription,
    removerPushSubscriptionsExpiradas
} from './adapters/supabase/push-subscriptions.adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@melonwallet.app';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

function getVapidKeys() {
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        return { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY };
    }

    console.warn('[VAPID] Chaves não encontradas no .env. Gerando chaves temporárias (não persistem entre reinícios).');
    console.warn('[VAPID] Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no ambiente para persistência.');
    return webpush.generateVAPIDKeys();
}

const vapidKeys = getVapidKeys();
webpush.setVAPIDDetails(
    VAPID_SUBJECT,
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
console.log('[VAPID] Chaves configuradas:', vapidKeys.publicKey.slice(0, 20) + '...');

app.get('/api/notifications/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/notifications/subscribe', async (req, res) => {
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Subscription inválida' });
    }

    const subscriptionData = {
        ...subscription,
        userId: req.headers['x-user-id'] || null,
        updatedAt: new Date().toISOString(),
    };

    const result = await salvarPushSubscription(subscriptionData);

    if (result.success) {
        console.log('[Push] Subscription registrada:', subscription.endpoint.slice(0, 40));
        res.json({ success: true, message: 'Inscrição registrada' });
    } else {
        res.status(500).json({ error: 'Falha ao registrar inscrição' });
    }
});

app.post('/api/notifications/unsubscribe', async (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint obrigatório' });
    }

    const result = await removerPushSubscription(endpoint);

    if (result.success) {
        console.log('[Push] Subscription removida:', endpoint.slice(0, 40));
        res.json({ success: true, message: 'Inscrição removida' });
    } else {
        res.status(500).json({ error: 'Falha ao remover inscrição' });
    }
});

app.post('/api/notifications/test', async (req, res) => {
    const { title, body, url } = req.body;

    const subscriptions = await listarPushSubscriptions();
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
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
            ).catch(err => {
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
        await removerPushSubscriptionsExpiradas(expired);
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

export { vapidKeys };
