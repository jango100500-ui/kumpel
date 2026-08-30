import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const api = {
  requestAuthCode: async (): Promise<string> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { error } = await supabase.from('auth_codes').insert({ code });
    if (error) {
      throw new Error(`Ошибка записи в базу: ${error.message}`);
    }
    return code;
  },

  verifyAuth: async (code: string): Promise<{ success: boolean; error?: string }> => {
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('auth_codes')
      .select('*')
      .eq('code', cleanCode)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return { success: false, error: `Ошибка базы данных: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Неверный код' };
    }

    const record = data[0];
    const createdTime = new Date(record.created_at).getTime();
    const nowTime = Date.now();

    if (nowTime - createdTime > 2 * 60 * 1000) {
      return { success: false, error: 'Код истек (прошло больше 2 минут)' };
    }

    return { success: true };
  },

  setupUser: async (payload: { token: string; name: string; username: string; avatar: string | null }): Promise<{ success: boolean }> => {
    const { error } = await supabase.from('users').upsert({
      token: payload.token,
      name: payload.name,
      username: payload.username.replace('@', '').toLowerCase(),
      avatar: payload.avatar,
      balance: 300,
    });
    if (error) throw error;
    return { success: true };
  },

  syncUser: async (token: string): Promise<any> => {
    const { data: user, error: userError } = await supabase.from('users').select('*').eq('token', token).single();
    if (userError || !user) return { error: 'User not found' };

    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const nowMsk = new Date(utcTime + 3 * 3600000);
    
    const day = nowMsk.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const lastMonday = new Date(nowMsk);
    lastMonday.setDate(nowMsk.getDate() - diff);
    lastMonday.setHours(0, 0, 0, 0);

    let balance = user.balance;
    const lastPayout = new Date(user.last_weekly_payout);
    if (lastPayout < lastMonday) {
      balance = Math.min(2000, balance + 150);
      await supabase.from('users').update({ balance, last_weekly_payout: new Date().toISOString() }).eq('token', token);
    }

    let rate = 1.0;
    const { data: marketData } = await supabase.from('market_history').select('*').order('date', { ascending: false }).limit(30);
    const todayStr = nowMsk.toISOString().split('T')[0];

    if (!marketData || marketData.length === 0) {
      let r = 1.0;
      for (let i = 30; i >= 0; i--) {
        const d = new Date(nowMsk);
        d.setDate(nowMsk.getDate() - i);
        r = Math.max(0.6, Math.min(1.8, r * (1 + (Math.random() * 0.18 - 0.08))));
        await supabase.from('market_history').insert({ date: d.toISOString().split('T')[0], rate: parseFloat(r.toFixed(2)) });
      }
      rate = parseFloat(r.toFixed(2));
    } else {
      const todayRec = marketData.find((m: any) => m.date === todayStr);
      if (todayRec) {
        rate = todayRec.rate;
      } else {
        const prevRate = marketData[0].rate;
        rate = Math.max(0.6, Math.min(1.8, prevRate * (1 + (Math.random() * 0.18 - 0.08))));
        rate = parseFloat(rate.toFixed(2));
        await supabase.from('market_history').insert({ date: todayStr, rate });
      }
    }

    const { data: historyList } = await supabase.from('market_history').select('*').order('date', { ascending: true }).limit(30);
    const { data: txs } = await supabase.from('transactions').select('*').or(`sender_token.eq.${token},receiver_token.eq.${token}`).order('timestamp', { ascending: false }).limit(30);

    const formattedTxs = (txs || []).map((tx: any) => {
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
      market_history: (historyList || []).map((m: any) => ({ date: m.date.slice(-5), rate: m.rate })),
      transactions: formattedTxs,
    };
  },

  transfer: async ({ token, recipient, amount }: { token: string; recipient: string; amount: number }): Promise<{ success: boolean; error?: string }> => {
    const cleanRecip = recipient.replace('@', '').trim().toLowerCase();
    const { data: sender } = await supabase.from('users').select('*').eq('token', token).single();
    const { data: receiver } = await supabase.from('users').select('*').ilike('username', cleanRecip).single();

    if (!receiver) return { success: false, error: 'Пользователь не найден' };
    if (receiver.token === token) return { success: false, error: 'Нельзя перевести себе' };

    const comm = amount <= 75 ? 0 : Math.ceil(amount * 0.05);
    const total = amount + comm;

    if (sender.balance < total) return { success: false, error: `Нужно ${total} ₭ (комиссия ${comm} ₭)` };

    await supabase.from('users').update({ balance: sender.balance - total }).eq('token', token);
    await supabase.from('users').update({ balance: Math.min(2000, receiver.balance + amount) }).eq('token', receiver.token);

    await supabase.from('transactions').insert({
      sender_token: token,
      sender_name: sender.name,
      receiver_token: receiver.token,
      receiver_name: receiver.name,
      amount,
    });

    return { success: true };
  },

  createQR: async ({ token, amount }: { token: string; amount: number }): Promise<{ success: boolean; qr_token?: string }> => {
    const qr_token = Math.random().toString(36).substring(2, 14);
    const { error } = await supabase.from('qr_codes').insert({
      token: qr_token,
      creator_token: token,
      amount,
      claimed: false,
    });
    if (error) throw error;
    return { success: true, qr_token };
  },

  getQRInfo: async (token: string): Promise<{ success: boolean; amount?: number; name?: string; username?: string }> => {
    const { data: qr } = await supabase.from('qr_codes').select('*').eq('token', token).eq('claimed', false).single();
    if (!qr) return { success: false };
    const { data: creator } = await supabase.from('users').select('*').eq('token', qr.creator_token).single();
    return { success: true, amount: qr.amount, name: creator?.name || 'Пользователь', username: creator?.username || 'user' };
  },

  payQR: async ({ token, qr_token }: { token: string; qr_token: string }): Promise<{ success: boolean; error?: string }> => {
    const { data: qr } = await supabase.from('qr_codes').select('*').eq('token', qr_token).eq('claimed', false).single();
    if (!qr) return { success: false, error: 'Счет уже оплачен' };

    const { data: sender } = await supabase.from('users').select('*').eq('token', token).single();
    const { data: receiver } = await supabase.from('users').select('*').eq('token', qr.creator_token).single();

    if (sender.balance < qr.amount) return { success: false, error: 'Недостаточно средств' };
    if (sender.token === qr.creator_token) return { success: false, error: 'Нельзя оплатить свой счет' };

    await supabase.from('users').update({ balance: sender.balance - qr.amount }).eq('token', token);
    await supabase.from('users').update({ balance: Math.min(2000, receiver.balance + qr.amount) }).eq('token', receiver.token);
    await supabase.from('qr_codes').update({ claimed: true }).eq('token', qr_token);

    await supabase.from('transactions').insert({
      sender_token: token,
      sender_name: sender.name,
      receiver_token: receiver.token,
      receiver_name: receiver.name,
      amount: qr.amount,
    });

    return { success: true };
  },
};
