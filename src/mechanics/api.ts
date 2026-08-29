const API_URL = 'https://kumpel.onrender.com/api';

export interface VerifyAuthResponse {
  success: boolean;
  token?: string;
  is_new?: boolean;
  username?: string;
  error?: string;
}

export interface SetupUserPayload {
  token: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface SyncUserResponse {
  profile: {
    name: string;
    username: string;
    avatar: string | null;
  };
  balance: number;
  rate: number;
  transactions: Array<{
    id: string;
    name: string;
    type: string;
    amount: string;
    isPositive: boolean;
    date: string;
  }>;
  market_history: Array<{
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
  new_balance?: number;
  amount?: number;
  commission?: number;
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

export const api = {
  verifyAuth: async (code: string): Promise<VerifyAuthResponse> => {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    return res.json();
  },

  setupUser: async (data: SetupUserPayload): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/user/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  syncUser: async (token: string): Promise<SyncUserResponse> => {
    const res = await fetch(`${API_URL}/user/sync?token=${token}`);
    return res.json();
  },

  transfer: async (data: TransferPayload): Promise<TransferResponse> => {
    const res = await fetch(`${API_URL}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  createQR: async (data: CreateQRPayload): Promise<CreateQRResponse> => {
    const res = await fetch(`${API_URL}/qr/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getQRInfo: async (token: string): Promise<QRInfoResponse> => {
    const res = await fetch(`${API_URL}/qr/info?token=${token}`);
    return res.json();
  },

  payQR: async (data: PayQRPayload): Promise<PayQRResponse> => {
    const res = await fetch(`${API_URL}/qr/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
