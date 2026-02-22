import { Router } from 'express';
import { fetchProfessionals, getCitiesFromProfessionals, getProfessionsFromProfessionals } from '../services/professionalsService.js';

const router = Router();

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let professionalsCache = [];
let lastFetchTime = 0;

function isCacheValid() {
  return Date.now() - lastFetchTime < CACHE_DURATION && professionalsCache.length > 0;
}

async function loadProfessionals(forceRefresh = false) {
  if (!forceRefresh && isCacheValid()) {
    return professionalsCache;
  }

  console.log('Fetching professionals...');
  professionalsCache = await fetchProfessionals();
  lastFetchTime = Date.now();
  console.log(`Cached ${professionalsCache.length} professionals`);
  return professionalsCache;
}

router.get('/', async (req, res) => {
  try {
    const { city, profession } = req.query;
    let professionals = await loadProfessionals();

    if (city) {
      professionals = professionals.filter(p => p.city === city);
    }

    if (profession) {
      professionals = professionals.filter(p => p.profession === profession);
    }

    res.json(professionals);
  } catch (error) {
    console.error('Error fetching professionals:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/cities', async (req, res) => {
  try {
    const professionals = await loadProfessionals();
    const cities = getCitiesFromProfessionals(professionals);
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/professions', async (req, res) => {
  try {
    const professionals = await loadProfessionals();
    const professions = getProfessionsFromProfessionals(professionals);
    res.json(professions);
  } catch (error) {
    console.error('Error fetching professions:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const professionals = await loadProfessionals(true);
    res.json({
      message: 'Cache refreshed',
      count: professionals.length,
    });
  } catch (error) {
    console.error('Error refreshing:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
