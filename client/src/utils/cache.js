const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export function getCached(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

export function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to cache:', e);
  }
}

export function clearCache(key) {
  try {
    if (key) {
      localStorage.removeItem(key);
    } else {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('anash_'));
      keys.forEach(k => localStorage.removeItem(k));
    }
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
}
