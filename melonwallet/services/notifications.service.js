import webpush from 'web-push';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const VAPID_FILE = join(__dirname, 'vapid-keys.json');
const SUBSCRIPTIONS_FILE = join(__dirname, 'subscriptions.json');

function getVapidKeys() {
    if (existsSync(VAPID_FILE)) {
        return JSON.parse(readFileSync(VAPID_FILE, 'utf8'));
    }
    throw new Error('Execute o server.js primeiro para gerar as chaves VAPID');
}

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

const vapidKeys = getVapidKeys();
webpush.setVAPIDDetails(
    'mailto:contato@melonwallet.app',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const SUBSCRIPTION_CATEGORIES = [
    { name: 'Netflix', monthlyPrice: 39.90, renewalDay: 15 },
    { name: 'Spotify', monthlyPrice: 21.90, renewalDay: 10 },
    { name: 'Amazon Prime', monthlyPrice: 14.90, renewalDay: 22 },
    { name: 'iFood Clube', monthlyPrice: 19.90, renewalDay: 5 },
    { name: 'Disney+', monthlyPrice: 27.90, renewalDay: 18 },
    { name: 'HBO Max', monthlyPrice: 39.90, renewalDay: 12 }
];

async function generateAIAnalysis(prompt) {
    if (!GEMINI_API_KEY) {
        return null;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 150
                    }
                })
            }
        );

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
        console.error('[AI] Erro ao gerar análise:', err.message);
        return null;
    }
}

export function calculateMonthsSince(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
}

export function calculateTotalSpent(monthlyPrice, months) {
    return (monthlyPrice * months).toFixed(2);
}

export async function sendAccumulatedTrackingNotification(subscription, userData) {
    const { serviceName, monthlyPrice, startDate } = userData;
    const months = calculateMonthsSince(startDate);
    const totalSpent = calculateTotalSpent(monthlyPrice, months);

    const aiPrompt = `Você é o assistente financeiro do Melon Wallet. Crie uma mensagem curta e impactante (máximo 80 caracteres) para notificar que o usuário assina ${serviceName} há ${months} meses e já gastou R$ ${totalSpent}. Use tom amigável e sugira ação.`;

    let messageBody = `Você assina o ${serviceName} há ${months} meses e já gastou R$ ${totalSpent}. Toque para ver a análise.`;

    const aiResponse = await generateAIAnalysis(aiPrompt);
    if (aiResponse) {
        messageBody = aiResponse.slice(0, 120);
    }

    const payload = JSON.stringify({
        title: `Rastreamento: ${serviceName}`,
        body: messageBody,
        url: '/dashboard.html#assinaturas',
        tag: `tracking-${serviceName.toLowerCase().replace(/\s+/g, '-')}`,
        requireInteraction: true,
        extraData: { type: 'accumulated', serviceName, months, totalSpent }
    });

    return sendPushNotification(subscription, payload);
}

export async function sendWeeklySummaryNotification(subscription, subscriptions, userData) {
    const { renewals, totalWeekly } = calculateWeeklyRenewals(subscriptions);

    const renewalsList = renewals.map(r => r.name).join(', ');
    const aiPrompt = `Você é o assistente financeiro do Melon Wallet. Crie uma mensagem curta e amigável (máximo 80 caracteres) informando que ${renewalsList} renovam esta semana totalizando R$ ${totalWeekly}. Use tom de cuidado com finanças.`;

    let messageBody = `${renewalsList} renovam nesta semana (R$ ${totalWeekly}). Tudo certo por aí?`;

    const aiResponse = await generateAIAnalysis(aiPrompt);
    if (aiResponse) {
        messageBody = aiResponse.slice(0, 120);
    }

    const payload = JSON.stringify({
        title: 'Resumo Semanal de Assinaturas',
        body: messageBody,
        url: '/dashboard.html#assinaturas',
        tag: 'weekly-summary',
        requireInteraction: true,
        extraData: { type: 'weekly-summary', renewals: renewalsList, totalWeekly }
    });

    return sendPushNotification(subscription, payload);
}

function calculateWeeklyRenewals(subscriptions) {
    const today = new Date();
    const weekAhead = new Date(today);
    weekAhead.setDate(today.getDate() + 7);

    const renewals = subscriptions.filter(sub => {
        if (!sub.renewalDay) return false;
        const renewalDate = new Date(today.getFullYear(), today.getMonth(), sub.renewalDay);
        return renewalDate >= today && renewalDate <= weekAhead;
    });

    const totalWeekly = renewals.reduce((sum, r) => sum + (r.monthlyPrice || 0), 0).toFixed(2);
    return { renewals, totalWeekly };
}

async function sendPushNotification(subscription, payload) {
    try {
        await webpush.sendNotification(subscription, payload);
        return { success: true };
    } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
            return { success: false, expired: true, endpoint: subscription.endpoint };
        }
        console.error('[Push] Erro ao enviar:', err.message);
        return { success: false, error: err.message };
    }
}

export async function processAndSendNotifications() {
    const subscriptions = loadSubscriptions();
    if (subscriptions.length === 0) {
        console.log('[Nenhuma inscrição ativa]');
        return { sent: 0, expired: 0 };
    }

    let sentCount = 0;
    let expiredCount = 0;

    for (const subscription of subscriptions) {
        if (subscription.monthlyPrice && subscription.startDate) {
            const result = await sendAccumulatedTrackingNotification(subscription, subscription);
            if (result.success) sentCount++;
            if (result.expired) expiredCount++;
        }
    }

    const weeklyResult = await sendWeeklySummaryToAll(subscriptions);
    sentCount += weeklyResult.sent;

    if (expiredCount > 0) {
        const active = subscriptions.filter(s =>
            !weeklyResult.expiredEndpoints.includes(s.endpoint)
        );
        saveSubscriptions(active);
    }

    console.log(`[Processamento] ${sentCount} enviadas, ${expiredCount} expiradas`);
    return { sent: sentCount, expired: expiredCount };
}

async function sendWeeklySummaryToAll(subscriptions) {
    const { renewals, totalWeekly } = calculateWeeklyRenewals(subscriptions);

    if (renewals.length === 0) {
        return { sent: 0, expiredEndpoints: [] };
    }

    let sent = 0;
    const expiredEndpoints = [];

    for (const subscription of subscriptions) {
        const result = await sendWeeklySummaryNotification(subscription, subscriptions, {});
        if (result.success) sent++;
        if (result.expired) expiredEndpoints.push(subscription.endpoint);
    }

    return { sent, expiredEndpoints };
}

export async function addSubscriptionCategory(subscriptionEndpoint, categoryData) {
    const subscriptions = loadSubscriptions();
    const index = subscriptions.findIndex(s => s.endpoint === subscriptionEndpoint);

    if (index >= 0) {
        subscriptions[index] = { ...subscriptions[index], ...categoryData };
        saveSubscriptions(subscriptions);
        return { success: true, message: 'Categoria atualizada' };
    }

    return { success: false, error: 'Subscription não encontrada' };
}

export async function getSubscriptionStats() {
    const subscriptions = loadSubscriptions();
    const total = subscriptions.length;
    const totalMonthly = subscriptions.reduce((sum, s) => sum + (s.monthlyPrice || 0), 0);
    const services = subscriptions
        .filter(s => s.monthlyPrice)
        .map(s => ({ name: s.name, price: s.monthlyPrice }));

    return {
        totalSubscriptions: total,
        totalMonthly: totalMonthly.toFixed(2),
        services
    };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log('Iniciando processamento de notificações...');
    processAndSendNotifications()
        .then(result => {
            console.log('Resultado:', result);
            process.exit(0);
        })
        .catch(err => {
            console.error('Erro fatal:', err);
            process.exit(1);
        });
}
