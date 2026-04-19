const STORAGE_KEY = 'qr_admin_auth';

function authHeader() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const { token } = JSON.parse(raw) || {};
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? authHeader() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Public
export const api = {
  // auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),

  // menu
  getMenu: () => request('/menu'),

  // tables (public)
  getTableByCode: (code) => request(`/tables/by-code/${encodeURIComponent(code)}`),
  getSampleTable: () => request('/tables/sample'),

  // orders (public)
  placeOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  getOrdersByTableCode: (code) => request(`/orders/by-table/${encodeURIComponent(code)}`),

  // admin
  admin: {
    listOrders: (status) =>
      request(`/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`, { auth: true }),
    updateOrderStatus: (id, status) =>
      request(`/orders/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
    listTables: () => request('/tables', { auth: true }),
    createTable: (number, label) =>
      request('/tables', { method: 'POST', body: { number, label }, auth: true }),
    deleteTable: (id) => request(`/tables/${id}`, { method: 'DELETE', auth: true }),
  },
};
