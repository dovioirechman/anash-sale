import { API_URL } from '../config';

export async function fetchArticles(topic, city) {
  const params = new URLSearchParams();
  if (topic) params.append('topic', topic);
  if (city) params.append('city', city);
  
  const queryString = params.toString();
  const url = queryString 
    ? `${API_URL}/articles?${queryString}` 
    : `${API_URL}/articles`;
  const response = await fetch(url);
  return response.json();
}

export async function fetchTopics() {
  const response = await fetch(`${API_URL}/articles/topics`);
  return response.json();
}

export async function fetchCities(topic) {
  const url = topic 
    ? `${API_URL}/articles/cities?topic=${encodeURIComponent(topic)}` 
    : `${API_URL}/articles/cities`;
  const response = await fetch(url);
  return response.json();
}

export async function fetchArticle(id) {
  const response = await fetch(`${API_URL}/articles/${id}`);
  return response.json();
}
