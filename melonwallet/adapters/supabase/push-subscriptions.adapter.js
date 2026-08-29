import { supabaseClient } from '../../config/supabase.js';

export async function listarPushSubscriptions() {
    const { data, error } = await supabaseClient
        .from('push_subscriptions')
        .select('*');

    if (error) {
        console.error('[Push] Erro ao listar subscriptions:', error.message);
        return [];
    }
    return data || [];
}

export async function salvarPushSubscription(subscription) {
    const { endpoint, keys, userId, createdAt, updatedAt } = subscription;

    const { data, error } = await supabaseClient
        .from('push_subscriptions')
        .upsert(
            {
                endpoint,
                p256dh: keys?.p256dh,
                auth: keys?.auth,
                user_id: userId,
                created_at: createdAt,
                updated_at: updatedAt,
            },
            { onConflict: 'endpoint' }
        )
        .select();

    if (error) {
        console.error('[Push] Erro ao salvar subscription:', error.message);
        return { success: false, error: error.message };
    }
    return { success: true, data };
}

export async function removerPushSubscription(endpoint) {
    const { error } = await supabaseClient
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

    if (error) {
        console.error('[Push] Erro ao remover subscription:', error.message);
        return { success: false, error: error.message };
    }
    return { success: true };
}

export async function removerPushSubscriptionsExpiradas(expiredEndpoints) {
    if (!expiredEndpoints || expiredEndpoints.length === 0) return;

    const { error } = await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);

    if (error) {
        console.error('[Push] Erro ao remover subscriptions expiradas:', error.message);
    }
}
