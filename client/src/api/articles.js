import { API_URL } from '../config';
import { getCached, setCache } from '../utils/cache';

export async function fetchArticles(topic, city) {
  const cacheKey = `anash_articles_${topic || 'all'}_${city || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (topic) params.append('topic', topic);
  if (city) params.append('city', city);
  
  const queryString = params.toString();
  const url = queryString 
    ? `${API_URL}/articles?${queryString}` 
    : `${API_URL}/articles`;
  const response = await fetch(url);
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}

export async function fetchTopics() {
  const cacheKey = 'anash_topics';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_URL}/articles/topics`);
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}

export async function fetchCities(topic) {
  const cacheKey = `anash_cities_${topic || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = topic 
    ? `${API_URL}/articles/cities?topic=${encodeURIComponent(topic)}` 
    : `${API_URL}/articles/cities`;
  const response = await fetch(url);
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}

export async function fetchArticle(id) {
  const cacheKey = `anash_article_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_URL}/articles/${id}`);
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}
