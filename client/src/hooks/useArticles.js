import { useState, useEffect } from 'react';
import { fetchArticles, fetchTopics, fetchCities } from '../api/articles';
import { getCached } from '../utils/cache';

// קטגוריות של דירות שמאפשרות סינון לפי עיר
const APARTMENT_CATEGORIES = [
  'דירות להשכרה',
  'דירות למכירה', 
  'דירות',
  'נדל״ן',
  'נדל"ן',
  'נדל״ן בלוד',
];

// Default categories to show immediately before API loads
const DEFAULT_TOPICS = [
  'דירות למכירה',
  'דירות להשכרה',
  'משרות',
  'רכבים',
  'ריהוט',
  'אלקטרוניקה',
  'ביגוד',
  'ספרים',
  'כללי',
  'חדשות חב״ד',
  'חדשות כלכלה',
  'נדל״ן בלוד',
];

export function isApartmentCategory(topic) {
  return APARTMENT_CATEGORIES.some(cat => 
    topic?.includes(cat) || cat.includes(topic)
  );
}

function getInitialTopics() {
  const cached = getCached('anash_topics');
  return cached || DEFAULT_TOPICS;
}

export function useArticles(selectedTopic, selectedCity) {
  const [articles, setArticles] = useState([]);
  const [topics, setTopics] = useState(getInitialTopics);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch topics on mount (will update if different from cache/default)
  useEffect(() => {
    fetchTopics()
      .then((newTopics) => {
        if (newTopics && newTopics.length > 0) {
          setTopics(newTopics);
        }
      })
      .catch((e) => console.error('Error fetching topics:', e));
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
    if (!selectedTopic) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchArticles(selectedTopic, selectedCity)
      .then(setArticles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedTopic, selectedCity]);

  return { articles, topics, cities, loading, error };
}
