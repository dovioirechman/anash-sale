import { Router } from 'express';
import { listAllArticles, fetchWhatsAppGroups } from '../services/googleDrive.js';
import { fetchChabadNews, fetchEconomyNews } from '../services/newsService.js';
import { detectCityInArticle, isApartmentCategory } from '../services/cityDetection.js';

const router = Router();

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let articlesCache = [];
let lastFetchTime = 0;

function isCacheValid() {
  return Date.now() - lastFetchTime < CACHE_DURATION && articlesCache.length > 0;
}

async function loadAllContent(forceRefresh = false) {
  if (!forceRefresh && isCacheValid()) {
    console.log('Serving from cache (expires in', Math.round((CACHE_DURATION - (Date.now() - lastFetchTime)) / 60000), 'minutes)');
    return articlesCache;
  }

  console.log('Fetching all content...');
  
  // Fetch all sources in parallel
  const [driveArticles, chabadNews, economyNews, whatsappGroups] = await Promise.all([
    listAllArticles(),
    fetchChabadNews(),
    fetchEconomyNews(),
    fetchWhatsAppGroups(),
  ]);
  
  let allArticles = [...driveArticles, ...chabadNews, ...economyNews, ...whatsappGroups];
  
  // Add city detection for apartment categories
  allArticles = allArticles.map(article => {
    if (isApartmentCategory(article.topic)) {
      const city = detectCityInArticle(article);
      return { ...article, city: city || null };
    }
    return article;
  });
  
  articlesCache = allArticles;
  lastFetchTime = Date.now();
  
  console.log(`Cached ${articlesCache.length} total items`);
  return articlesCache;
}

router.get('/', async (req, res) => {
  try {
    const { topic, city } = req.query;
    let articles = await loadAllContent();
    
    if (topic) {
      articles = articles.filter((a) => a.topic === topic);
    }
    
    // Filter by city if provided
    if (city) {
      articles = articles.filter((a) => a.city === city);
    }
    
    // Return articles with summary for list view
    const articlesForList = articles.map(({ content, ...rest }) => ({
      ...rest,
      summary: rest.summary || (content ? content.substring(0, 150).trim() + (content.length > 150 ? '...' : '') : ''),
    }));
    
    res.json(articlesForList);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cities for a specific topic (apartment categories only)
router.get('/cities', async (req, res) => {
  try {
    const { topic } = req.query;
    const articles = await loadAllContent();
    
    // Filter by topic if provided
    let filtered = topic ? articles.filter(a => a.topic === topic) : articles;
    
    // Only include apartment categories
    filtered = filtered.filter(a => isApartmentCategory(a.topic));
    
    // Extract unique cities (excluding null)
    const cities = [...new Set(filtered.map(a => a.city).filter(Boolean))].sort();
    
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/topics', async (req, res) => {
  try {
    const articles = await loadAllContent();
    // Extract unique topics from articles
    const topics = [...new Set(articles.map(a => a.topic))];
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let articles = await loadAllContent();
    const article = articles.find((a) => a.id === req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    // Force refresh cache
    const articles = await loadAllContent(true);
    res.json({ 
      message: 'Cache refreshed', 
      count: articles.length,
      nextRefresh: new Date(Date.now() + CACHE_DURATION).toISOString()
    });
  } catch (error) {
    console.error('Error refreshing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cache status
router.get('/cache/status', (req, res) => {
  const cacheAge = Date.now() - lastFetchTime;
  const isValid = isCacheValid();
  const topics = [...new Set(articlesCache.map(a => a.topic))];
  
  res.json({
    cached: isValid,
    articlesCount: articlesCache.length,
    topicsCount: topics.length,
    ageMinutes: Math.round(cacheAge / 60000),
    expiresInMinutes: isValid ? Math.round((CACHE_DURATION - cacheAge) / 60000) : 0,
    lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
  });
});

export default router;
