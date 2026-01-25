// In production (Vercel), use relative URL. In dev, use localhost
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4001/api');

