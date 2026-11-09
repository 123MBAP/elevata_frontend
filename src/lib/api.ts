const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const productionApiUrl = 'https://elevata-backend.onrender.com/api';
const developmentApiUrl = 'http://localhost:5000/api';
const selectedApiUrl = import.meta.env.PROD && configuredApiUrl?.includes('localhost')
  ? productionApiUrl
  : (configuredApiUrl || (import.meta.env.PROD ? productionApiUrl : developmentApiUrl));
const BASE_URL = selectedApiUrl.endsWith('/api') ? selectedApiUrl : `${selectedApiUrl}/api`;

let refreshPromise: Promise<string> | null = null;

async function requestTokenRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('elevata_refresh_token');
  if (!refreshToken) {
    throw new Error('Session expired. Please log in again.');
  }

  const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!refreshRes.ok) {
    throw new Error('Refresh request failed');
  }

  const refreshData = await refreshRes.json();
  const rotatedAccessToken = refreshData?.data?.token || refreshData?.data?.accessToken;
  const rotatedRefreshToken = refreshData?.data?.refreshToken;

  if (!rotatedAccessToken) {
    throw new Error('Failed to retrieve refreshed session token');
  }

  localStorage.setItem('elevata_access_token', rotatedAccessToken);
  if (rotatedRefreshToken) {
    localStorage.setItem('elevata_refresh_token', rotatedRefreshToken);
  }

  return rotatedAccessToken;
}

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

  // 3. Set up AbortController timeout if none provided (45s for file uploads/cold starts)
  let timeoutId: any;
  let signal = options.signal;
  if (!signal && typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    timeoutId = setTimeout(() => {
      controller.abort();
    }, 45000);
    signal = controller.signal;
  }

  const config: RequestInit = {
    ...options,
    headers,
    signal
  };

  try {
    const response = await fetch(url, config);

    // 4. Intercept 401 Unauthorized & rotate tokens
    if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register')) {
      if (path.includes('/auth/refresh')) {
        localStorage.removeItem('elevata_access_token');
        localStorage.removeItem('elevata_refresh_token');
        window.dispatchEvent(new Event('auth-logout'));
        throw new Error('Session expired');
      }

      try {
        if (!refreshPromise) {
          refreshPromise = requestTokenRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const rotatedToken = await refreshPromise;

        // Retry the original request with the new access token
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${rotatedToken}`);
        if (!retryHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
          retryHeaders.set('Content-Type', 'application/json');
        }

        const retryResponse = await fetch(url, { ...options, headers: retryHeaders, signal: options.signal });
        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.message || 'API Request failed after token refresh');
        }
        return retryData;
      } catch (refreshErr) {
        localStorage.removeItem('elevata_access_token');
        localStorage.removeItem('elevata_refresh_token');
        window.dispatchEvent(new Event('auth-logout'));
        throw refreshErr;
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred during the API call');
    }

    return data;
  } catch (error: any) {
    console.error(`🔴 API Client Error [${path}]:`, error.message);
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function apiFile(path: string): Promise<Blob> {
  const headers = new Headers();
  const accessToken = localStorage.getItem('elevata_access_token');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${BASE_URL}${path}`, { headers });
  if (!response.ok) {
    let message = 'Unable to open this document.';
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // The server may return an empty/non-JSON error response.
    }
    throw new Error(message);
  }
  return response.blob();
}
