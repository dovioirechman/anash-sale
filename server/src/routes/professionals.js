import { Router } from 'express';
import { fetchProfessionals } from '../services/professionalsService.js';

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

// Helper to normalize text (trim, lowercase for comparison)
function normalizeText(text) {
  return text?.trim().toLowerCase() || '';
}

// Helper to split professions by comma
function splitProfessions(profession) {
  if (!profession) return [];
  return profession.split(/[,،]/).map(p => p.trim()).filter(Boolean);
}

// Helper to get unique cities (normalized)
function getUniqueCities(professionals) {
  const cityMap = new Map();
  professionals.forEach(p => {
    if (p.city) {
      const normalized = normalizeText(p.city);
      if (!cityMap.has(normalized)) {
        cityMap.set(normalized, p.city.trim());
      }
    }
  });
  return [...cityMap.values()].sort();
}

// Helper to get unique professions (normalized, split by comma)
function getUniqueProfessions(professionals) {
  const professionMap = new Map();
  professionals.forEach(p => {
    splitProfessions(p.profession).forEach(prof => {
      const normalized = normalizeText(prof);
      if (!professionMap.has(normalized)) {
        professionMap.set(normalized, prof);
      }
    });
  });
  return [...professionMap.values()].sort();
}

router.get('/', async (req, res) => {
  try {
    const { city, profession } = req.query;
    let professionals = await loadProfessionals();

    if (city) {
      const normalizedCity = normalizeText(city);
      professionals = professionals.filter(p => normalizeText(p.city) === normalizedCity);
    }

    if (profession) {
      const normalizedProfession = normalizeText(profession);
      professionals = professionals.filter(p => {
        const profs = splitProfessions(p.profession);
        return profs.some(prof => normalizeText(prof) === normalizedProfession);
      });
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
    const cities = getUniqueCities(professionals);
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/professions', async (req, res) => {
  try {
    const professionals = await loadProfessionals();
    const professions = getUniqueProfessions(professionals);
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
