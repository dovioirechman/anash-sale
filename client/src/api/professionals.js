import { API_URL } from '../config';
import { getCached, setCache } from '../utils/cache';

export async function fetchProfessionals(city = null, profession = null) {
  const cacheKey = `anash_professionals_${city || 'all'}_${profession || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (city) params.append('city', city);
  if (profession) params.append('profession', profession);
  
  const url = `${API_URL}/professionals${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch professionals');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}

export async function fetchCities() {
  const cacheKey = 'anash_pro_cities';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_URL}/professionals/cities`);
  if (!response.ok) throw new Error('Failed to fetch cities');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}

export async function fetchProfessions() {
  const cacheKey = 'anash_professions';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_URL}/professionals/professions`);
  if (!response.ok) throw new Error('Failed to fetch professions');
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}
