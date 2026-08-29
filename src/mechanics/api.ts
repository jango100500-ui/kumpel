const API_URL = 'https://kumpel.onrender.com/api';

export interface VerifyAuthResponse {
  success: boolean;
  token?: string;
  is_new?: boolean;
  initial_name?: string;
  initial_username?: string;
  error?: string;
}

export interface SetupUserPayload {
  token: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface SyncUserResponse {
  profile?: {
    name: string;
    username: string;
    avatar: string | null;
  };
  balance?: number;
  rate?: number;
  transactions?: Array<{
    id: string;
    name: string;
    type: string;
    amount: string;
    isPositive: boolean;
    date: string;
  }>;
  market_history?: Array<{
    date: string;
    rate: number;
  }>;
  error?: string;
}

export interface TransferPayload {
  token: string;
  recipient: string;
  amount: number;
}

export interface TransferResponse {
  success: boolean;
  error?: string;
}

export interface CreateQRPayload {
  token: string;
  amount: number;
}

export interface CreateQRResponse {
  success: boolean;
  qr_token?: string;
  error?: string;
}

export interface QRInfoResponse {
  success: boolean;
  amount?: number;
  name?: string;
  username?: string;
  error?: string;
}

export interface PayQRPayload {
  token: string;
  qr_token: string;
}

export interface PayQRResponse {
  success: boolean;
  error?: string;
}

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Ошибка сервера (${res.status}): ${text.slice(0, 100)}`);
    }
  } catch (err: any) {
    throw new Error(err.message || 'Сетевая ошибка при обращении к серверу');
  }
}

export const api = {
  verifyAuth: async (code: string): Promise<VerifyAuthResponse> => {
    return safeFetch<VerifyAuthResponse>(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  },

  setupUser: async (data: SetupUserPayload): Promise<{ success: boolean }> => {
    return safeFetch<{ success: boolean }>(`${API_URL}/user/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  syncUser: async (token: string): Promise<SyncUserResponse> => {
    return safeFetch<SyncUserResponse>(`${API_URL}/user/sync?token=${token}`);
  },

  transfer: async (data: TransferPayload): Promise<TransferResponse> => {
    return safeFetch<TransferResponse>(`${API_URL}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  createQR: async (data: CreateQRPayload): Promise<CreateQRResponse> => {
    return safeFetch<CreateQRResponse>(`${API_URL}/qr/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  getQRInfo: async (token: string): Promise<QRInfoResponse> => {
    return safeFetch<QRInfoResponse>(`${API_URL}/qr/info?token=${token}`);
  },

  payQR: async (data: PayQRPayload): Promise<PayQRResponse> => {
    return safeFetch<PayQRResponse>(`${API_URL}/qr/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};
