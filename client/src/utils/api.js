// API utility to handle dynamic base URL for different devices
const getApiBaseUrl = () => {
  const { protocol, hostname } = window.location;
  // Dynamic host for DNS/Local Network support
  return `${protocol}//${hostname}:5000`;
};

export const API_BASE_URL = getApiBaseUrl();

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Log request details for debugging
  let logBody;
  try {
    logBody = options.body ? JSON.parse(options.body) : undefined;
  } catch {
    logBody = options.body;
  }
  console.log('API Request:', {
    url,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: logBody
  });

  // Ensure body is handled correctly
  let processedOptions = { ...options };
  const isFormData = processedOptions.body instanceof FormData;

  if (processedOptions.body && typeof processedOptions.body === 'object' && !isFormData) {
    processedOptions.body = JSON.stringify(processedOptions.body);
  }

  // Get token from localStorage
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method: options.method || 'GET',
    headers,
    credentials: 'include',
    ...processedOptions,
  };

  try {
    const response = await fetch(url, config);

    // Log response status
    console.log('API Response Status:', response.status);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If not JSON, use the raw text if it's short
          if (text && text.length < 100) {
            errorMessage = text;
          }
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('API Response Data:', data);
    return data;
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
};
