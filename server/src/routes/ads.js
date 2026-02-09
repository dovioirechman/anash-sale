import { Router } from 'express';
import { fetchAds, fetchPageAds } from '../services/adsService.js';

const router = Router();

// Cache for banner ads
let adsCache = [];
let lastFetchTime = 0;

// Cache for page ads
let pageAdsCache = [];
let pageAdsLastFetchTime = 0;

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function isCacheValid(cacheTime) {
  return Date.now() - cacheTime < CACHE_DURATION;
}

// Banner ads (top, middle, sidebar)
router.get('/', async (req, res) => {
  try {
    if (!isCacheValid(lastFetchTime) || adsCache.length === 0) {
      adsCache = await fetchAds();
      lastFetchTime = Date.now();
    }
    
    const { position } = req.query;
    let ads = adsCache;
    
    if (position) {
      ads = ads.filter(ad => ad.position === position);
    }
    
    res.json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: error.message });
  }
});

// Page ads (for the main ads tab) from "עמוד המודעות" folder
router.get('/page', async (req, res) => {
  try {
    if (!isCacheValid(pageAdsLastFetchTime) || pageAdsCache.length === 0) {
      pageAdsCache = await fetchPageAds();
      pageAdsLastFetchTime = Date.now();
    }
    
    res.json(pageAdsCache);
  } catch (error) {
    console.error('Error fetching page ads:', error);
    res.status(500).json({ error: error.message });
  }
});

// Force refresh all ads cache
router.post('/refresh', async (req, res) => {
  try {
    const [bannerAds, pageAds] = await Promise.all([
      fetchAds(),
      fetchPageAds()
    ]);
    adsCache = bannerAds;
    pageAdsCache = pageAds;
    lastFetchTime = Date.now();
    pageAdsLastFetchTime = Date.now();
    res.json({ 
      message: 'Ads cache refreshed', 
      bannerAdsCount: adsCache.length,
      pageAdsCount: pageAdsCache.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

