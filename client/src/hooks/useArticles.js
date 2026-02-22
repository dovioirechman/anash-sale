import { useState, useEffect } from 'react';
import { fetchArticles, fetchCities } from '../api/articles';

// קטגוריות של דירות שמאפשרות סינון לפי עיר
const APARTMENT_CATEGORIES = [
  'דירות להשכרה',
  'דירות למכירה', 
  'דירות',
  'נדל״ן',
  'נדל"ן',
  'נדל״ן בלוד',
];

// Main categories to show in the filter (not sub-filters like professions/cities)
const MAIN_CATEGORIES = [
  'משרות',
  'דירות למכירה',
  'דירות להשכרה',
  'חדשות חב״ד',
  'חדשות כלכלה',
];

export function isApartmentCategory(topic) {
  return APARTMENT_CATEGORIES.some(cat => 
    topic?.includes(cat) || cat.includes(topic)
  );
}

export function useArticles(selectedTopic, selectedCity) {
  const [articles, setArticles] = useState([]);
  const [topics] = useState(MAIN_CATEGORIES);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
