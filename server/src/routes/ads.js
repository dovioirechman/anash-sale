import { Router } from 'express';
import { fetchAds, fetchPageAds } from '../services/adsService.js';
import https from 'https';

const router = Router();

// Image proxy to bypass Google Drive CORS restrictions
router.get('/image/:fileId', (req, res) => {
  const { fileId } = req.params;
  const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
  
  https.get(driveUrl, (driveRes) => {
    // Follow redirects
    if (driveRes.statusCode === 302 || driveRes.statusCode === 301) {
      https.get(driveRes.headers.location, (finalRes) => {
        res.set('Content-Type', finalRes.headers['content-type'] || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        finalRes.pipe(res);
      }).on('error', (err) => {
        console.error('Image proxy redirect error:', err);
        res.status(500).send('Error fetching image');
      });
    } else {
      res.set('Content-Type', driveRes.headers['content-type'] || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      driveRes.pipe(res);
    }
  }).on('error', (err) => {
    console.error('Image proxy error:', err);
    res.status(500).send('Error fetching image');
  });
});

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

