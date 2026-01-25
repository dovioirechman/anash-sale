import { useState, useEffect } from 'react';
import { fetchArticles, fetchTopics, fetchCities } from '../api/articles';

// קטגוריות של דירות שמאפשרות סינון לפי עיר
const APARTMENT_CATEGORIES = [
  'דירות להשכרה',
  'דירות למכירה', 
  'דירות',
  'נדל״ן',
  'נדל"ן',
  'נדל״ן בלוד',
];

export function isApartmentCategory(topic) {
  return APARTMENT_CATEGORIES.some(cat => 
    topic?.includes(cat) || cat.includes(topic)
  );
}

export function useArticles(selectedTopic, selectedCity) {
  const [articles, setArticles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics()
      .then(setTopics)
      .catch((e) => setError(e.message));
  }, []);

  // Fetch cities when topic changes (only for apartment categories)
  useEffect(() => {
    if (selectedTopic && isApartmentCategory(selectedTopic)) {
      fetchCities(selectedTopic)
        .then(setCities)
        .catch((e) => console.error('Error fetching cities:', e));
    } else {
      setCities([]);
    }
  }, [selectedTopic]);

  // Fetch articles based on selected topic and city
  useEffect(() => {
    setLoading(true);
    fetchArticles(selectedTopic, selectedCity)
      .then(setArticles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedTopic, selectedCity]);

  return { articles, topics, cities, loading, error };
}
