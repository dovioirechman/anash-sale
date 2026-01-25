import { Router } from 'express';
import { fetchChabadNews, fetchEconomyNews } from '../services/newsService.js';

const router = Router();

// Chabad news
router.get('/chabad', async (req, res) => {
  try {
    const news = await fetchChabadNews();
    res.json(news);
  } catch (error) {
    console.error('Error fetching Chabad news:', error);
    res.status(500).json({ error: error.message });
  }
});

// Economy news
router.get('/economy', async (req, res) => {
  try {
    const news = await fetchEconomyNews();
    res.json(news);
  } catch (error) {
    console.error('Error fetching Economy news:', error);
    res.status(500).json({ error: error.message });
  }
});

// All news combined (legacy endpoint)
router.get('/', async (req, res) => {
  try {
    const [chabadNews, economyNews] = await Promise.all([
      fetchChabadNews(),
      fetchEconomyNews(),
    ]);
    res.json([...chabadNews, ...economyNews]);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
