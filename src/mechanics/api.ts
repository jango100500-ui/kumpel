const API_URL = 'https://kumpel.onrender.com/api';

export const api = {
  verifyAuth: async (code: string) => fetch(`${API_URL}/auth/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }).then(res => res.json()),
  setupUser: async (data: any) => fetch(`${API_URL}/user/setup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
  syncUser: async (token: string) => fetch(`${API_URL}/user/sync?token=${token}`).then(res => res.json()),
  transfer: async (data: any) => fetch(`${API_URL}/transfer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
  createQR: async (data: any) => fetch(`${API_URL}/qr/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
  getQRInfo: async (token: string) => fetch(`${API_URL}/qr/info?token=${token}`).then(res => res.json()),
  payQR: async (data: any) => fetch(`${API_URL}/qr/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
};
