let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Bulletproof check: automatically append /api if the user forgot to add it in Vercel
if (rawUrl && !rawUrl.endsWith('/api')) {
  // Strip trailing slash if it exists before adding /api
  if (rawUrl.endsWith('/')) {
    rawUrl = rawUrl.slice(0, -1);
  }
  rawUrl += '/api';
}
export const BASE_URL = rawUrl;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('vms_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // If body is FormData, delete Content-Type to let browser set boundary automatically
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expired or invalid, auto-logout client
      localStorage.removeItem('vms_token');
      localStorage.removeItem('vms_user');
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/' && !window.location.pathname.startsWith('/register') && !window.location.pathname.startsWith('/status') && !window.location.pathname.startsWith('/pass')) {
        window.location.href = '/login?expired=true';
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  get: (endpoint, headers = {}) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers = {}) => request(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    headers,
  }),
  put: (endpoint, body, headers = {}) => request(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
    headers,
  }),
  delete: (endpoint, headers = {}) => request(endpoint, { method: 'DELETE', headers }),
};
