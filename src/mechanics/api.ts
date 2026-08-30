import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

const getMskDate = () => {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 3);
};

export const api = {
  requestAuthCode: async () => {
    const code = Math.random().toString().slice(2, 8).toUpperCase();
    await supabase.table('auth_codes').insert({
      code,
      created_at: getMskDate().toISOString(),
    });
    return code;
  },

  verifyAuth: async (code: string) => {
    const { data } = await supabase.table('auth_codes').select('*').eq('code', code).single();
    if (!data) return { success: false, error: 'Неверный код' };

    const created = new Date(data.created_at).getTime();
    const now = getMskDate().getTime();
    if (now - created > 2 * 60000) {
      return { success: false, error: 'Код истек (прошло больше 2 минут)' };
    }
    return { success: true };
  },

  setupUser: async (payload: { token: string; name: string; username: string; avatar: string | null }) => {
    const { error } = await supabase.table('users').insert({
      token: payload.token,
      name: payload.name,
      username: payload.username,
      avatar: payload.avatar,
      balance: 300,
      last_weekly_payout: getMskDate().toISOString(),
    });
    if (error) throw error;
    return { success: true };
  },

  syncUser: async (token: string) => {
    const { data: user } = await supabase.table('users').select('*').eq('token', token).single();
    if (!user) return { error: 'Not found' };

    const now = getMskDate();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - diff);
    lastMonday.setHours(0, 0, 0, 0);

    let balance = user.balance;
    const lastPayout = new Date(user.last_weekly_payout);
    if (lastPayout < lastMonday) {
      balance = Math.min(2000, balance + 150);
      await supabase.table('users').update({ balance, last_weekly_payout: now.toISOString() }).eq('token', token);
    }

    let rate = 1.0;
    const { data: marketData } = await supabase.table('market_history').select('*').order('date', { ascending: false }).limit(30);
    const todayStr = now.toISOString().split('T')[0];

    if (!marketData || marketData.length === 0) {
      let r = 1.0;
      for (let i = 30; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        r = Math.max(0.6, Math.min(1.8, r * (1 + (Math.random() * 0.18 - 0.08))));
        await supabase.table('market_history').insert({ date: d.toISOString().split('T')[0], rate: parseFloat(r.toFixed(2)) });
      }
      rate = parseFloat(r.toFixed(2));
    } else {
      const todayRec = marketData.find((m) => m.date === todayStr);
      if (todayRec) {
        rate = todayRec.rate;
      } else {
        const prevRate = marketData[0].rate;
        rate = Math.max(0.6, Math.min(1.8, prevRate * (1 + (Math.random() * 0.18 - 0.08))));
        rate = parseFloat(rate.toFixed(2));
        await supabase.table('market_history').insert({ date: todayStr, rate });
      }
    }

    const finalMarket = await supabase.table('market_history').select('*').order('date', { ascending: true }).limit(30);
    const { data: txs } = await supabase.table('transactions').select('*').or(`sender_token.eq.${token},receiver_token.eq.${token}`).order('timestamp', { ascending: false }).limit(30);

    const formattedTxs = (txs || []).map((tx) => {
      const isPos = tx.receiver_token === token;
      return {
        id: tx.id.toString(),
        name: isPos ? tx.sender_name : tx.receiver_name,
        type: isPos ? 'Входящий перевод' : 'Перевод',
        amount: `${isPos ? '+' : '-'}${tx.amount} ₭`,
        isPositive: isPos,
        date: new Date(tx.timestamp).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      };
    });

    return {
      profile: { name: user.name, username: user.username, avatar: user.avatar },
      balance,
      rate,
      market_history: (finalMarket.data || []).map((m) => ({ date: m.date.slice(-5), rate: m.rate })),
      transactions: formattedTxs,
    };
  },

  transfer: async ({ token, recipient, amount }: { token: string; recipient: string; amount: number }) => {
    const { data: sender } = await supabase.table('users').select('*').eq('token', token).single();
    const { data: receiver } = await supabase.table('users').select('*').ilike('username', recipient).single();

    if (!receiver) return { success: false, error: 'Пользователь не найден' };
    if (receiver.token === token) return { success: false, error: 'Нельзя перевести себе' };

    const comm = amount <= 75 ? 0 : Math.ceil(amount * 0.05);
    const total = amount + comm;

    if (sender.balance < total) return { success: false, error: `Нужно ${total} ₭ (комиссия ${comm} ₭)` };

    await supabase.table('users').update({ balance: sender.balance - total }).eq('token', token);
    await supabase.table('users').update({ balance: Math.min(2000, receiver.balance + amount) }).eq('token', receiver.token);

    await supabase.table('transactions').insert({
      sender_token: token,
      sender_name: sender.name,
      receiver_token: receiver.token,
      receiver_name: receiver.name,
      amount,
      timestamp: getMskDate().toISOString(),
    });

    return { success: true };
  },

  createQR: async ({ token, amount }: { token: string; amount: number }) => {
    const qr_token = Math.random().toString(36).substring(2, 14);
    await supabase.table('qr_codes').insert({
      token: qr_token,
      creator_token: token,
      amount,
      claimed: false,
      created_at: getMskDate().toISOString(),
    });
    return { success: true, qr_token };
  },

  getQRInfo: async (token: string) => {
    const { data: qr } = await supabase.table('qr_codes').select('*').eq('token', token).eq('claimed', false).single();
    if (!qr) return { success: false };
    const { data: creator } = await supabase.table('users').select('*').eq('token', qr.creator_token).single();
    return { success: true, amount: qr.amount, name: creator?.name || 'Пользователь', username: creator?.username || 'user' };
  },

  payQR: async ({ token, qr_token }: { token: string; qr_token: string }) => {
    const { data: qr } = await supabase.table('qr_codes').select('*').eq('token', qr_token).eq('claimed', false).single();
    if (!qr) return { success: false, error: 'Счет уже оплачен' };

    const { data: sender } = await supabase.table('users').select('*').eq('token', token).single();
    const { data: receiver } = await supabase.table('users').select('*').eq('token', qr.creator_token).single();

    if (sender.balance < qr.amount) return { success: false, error: 'Недостаточно средств' };
    if (sender.token === qr.creator_token) return { success: false, error: 'Нельзя оплатить свой счет' };

    await supabase.table('users').update({ balance: sender.balance - qr.amount }).eq('token', token);
    await supabase.table('users').update({ balance: Math.min(2000, receiver.balance + qr.amount) }).eq('token', receiver.token);
    await supabase.table('qr_codes').update({ claimed: true }).eq('token', qr_token);

    await supabase.table('transactions').insert({
      sender_token: token,
      sender_name: sender.name,
      receiver_token: receiver.token,
      receiver_name: receiver.name,
      amount: qr.amount,
      timestamp: getMskDate().toISOString(),
    });

    return { success: true };
  },
};
