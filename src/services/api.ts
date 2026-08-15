// Get the backend API base URL from Vite environment variables or fallback to your Railway subdomain identifier
export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dstoma_custom_api_url');
    if (saved) return saved.replace(/\/$/, '');
  }
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, ''); // strip trailing slash

  // Safe default: use relative URL/current origin so the local Express backend is used!
  return typeof window !== 'undefined' ? window.location.origin : '';
};
