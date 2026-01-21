// API utility to handle dynamic base URL for different devices
const getApiBaseUrl = () => {
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
};

export const API_BASE_URL = getApiBaseUrl();

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};
