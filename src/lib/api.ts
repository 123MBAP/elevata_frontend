const BASE_URL = 'http://localhost:5000/api';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

/**
 * Perform an authenticated or public HTTP API request.
 * Automatically attaches local JWT tokens and handles silent token refresh on 401s.
 * @param {string} path - API endpoint sub-path (e.g. '/auth/login')
 * @param {RequestInit} options - Request options (headers, method, body, etc.)
 */
export async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${BASE_URL}${path}`;
  
  // Clone options and create standard headers
  const headers = new Headers(options.headers || {});

  // 1. Inject Authorization Header if token exists in storage
  const accessToken = localStorage.getItem('elevata_access_token');
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // 2. Set default JSON content-type
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    // 3. Intercept 401 Unauthorized & rotate tokens
    if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register')) {
      if (path.includes('/auth/refresh')) {
        // Refresh failed, clear and logout
        localStorage.removeItem('elevata_access_token');
        localStorage.removeItem('elevata_refresh_token');
        window.dispatchEvent(new Event('auth-logout'));
        throw new Error('Session expired');
      }

      if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = localStorage.getItem('elevata_refresh_token');

        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (!refreshRes.ok) {
            throw new Error('Refresh request failed');
          }

          const refreshData = await refreshRes.json();
          const rotatedAccessToken = refreshData.data.token;
          const rotatedRefreshToken = refreshData.data.refreshToken;

          localStorage.setItem('elevata_access_token', rotatedAccessToken);
          localStorage.setItem('elevata_refresh_token', rotatedRefreshToken);

          isRefreshing = false;
          onRefreshed(rotatedAccessToken);
        } catch (refreshErr) {
          isRefreshing = false;
          localStorage.removeItem('elevata_access_token');
          localStorage.removeItem('elevata_refresh_token');
          window.dispatchEvent(new Event('auth-logout'));
          throw refreshErr;
        }
      }

      // Wait for refresh to complete and retry the original request
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          fetch(url, { ...options, headers })
            .then((res) => res.json())
            .then((json) => {
              if (json.success) resolve(json);
              else reject(new Error(json.message || 'API Request failed after token refresh'));
            })
            .catch(reject);
        });
      });
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred during the API call');
    }

    return data;
  } catch (error: any) {
    console.error(`🔴 API Client Error [${path}]:`, error.message);
    throw error;
  }
}
