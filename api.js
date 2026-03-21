// js/api.js
// =============================================
// API SERVICE LAYER
// All communication with the backend goes here.
// =============================================

const API_BASE = '/api';

// ── Token helpers ─────────────────────────────
const Auth = {
  getToken:    () => localStorage.getItem('iq_token'),
  setToken:    (t) => localStorage.setItem('iq_token', t),
  removeToken: () => localStorage.removeItem('iq_token'),
  getUser:     () => { try { return JSON.parse(localStorage.getItem('iq_user')); } catch { return null; } },
  setUser:     (u) => localStorage.setItem('iq_user', JSON.stringify(u)),
  removeUser:  () => localStorage.removeItem('iq_user'),
  isLoggedIn:  () => !!localStorage.getItem('iq_token')
};

// ── Core fetch wrapper ────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    // Token expired — force logout
    if (res.status === 401) { Auth.removeToken(); Auth.removeUser(); }
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

// ── Auth API ──────────────────────────────────
const AuthAPI = {
  login:   (email, password)   => apiFetch('/auth/login',  { method:'POST', body: JSON.stringify({ email, password }) }),
  signup:  (payload)           => apiFetch('/auth/signup', { method:'POST', body: JSON.stringify(payload) }),
  me:      ()                  => apiFetch('/auth/me')
};

// ── Opportunities API ─────────────────────────
const OppsAPI = {
  getAll:       (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch('/opportunities' + (q ? '?' + q : ''));
  },
  getRecommended: () => apiFetch('/opportunities/recommended'),
  getUrgent:      () => apiFetch('/opportunities/urgent'),
  getById:        (id) => apiFetch('/opportunities/' + id),
  create:         (data) => apiFetch('/opportunities', { method:'POST', body: JSON.stringify(data) }),
  update:         (id, data) => apiFetch('/opportunities/' + id, { method:'PUT', body: JSON.stringify(data) }),
  remove:         (id) => apiFetch('/opportunities/' + id, { method:'DELETE' })
};

// ── Applications API ──────────────────────────
const AppsAPI = {
  apply:     (opportunityId) => apiFetch('/applications/apply', { method:'POST', body: JSON.stringify({ opportunityId }) }),
  getMyApps: (status)        => apiFetch('/applications' + (status ? '?status=' + status : '')),
  getAll:    ()              => apiFetch('/applications/all')
};

// ── Users API ─────────────────────────────────
const UsersAPI = {
  getProfile:    ()       => apiFetch('/users/profile'),
  updateProfile: (data)   => apiFetch('/users/profile', { method:'PUT', body: JSON.stringify(data) }),
  getAll:        ()       => apiFetch('/users')
};

// ── Analytics API ─────────────────────────────
const AnalyticsAPI = {
  getAdmin: () => apiFetch('/analytics'),
  getMe:    () => apiFetch('/analytics/me')
};

// ── Resume API ────────────────────────────────
const ResumeAPI = {
  upload: async (file) => {
    const token = Auth.getToken();
    const form = new FormData();
    form.append('resume', file);
    const res = await fetch(API_BASE + '/resume/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }
};
