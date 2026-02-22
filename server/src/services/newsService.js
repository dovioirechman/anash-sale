// Service to fetch news headlines from various sources
// LEGAL: Only headlines with links to original source (like search engines)

import crypto from 'crypto';

// Helper to create stable ID from string
function createStableId(prefix, text) {
  const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
  return `${prefix}-${hash}`;
}

// Caches
let chabadNewsCache = [];
let economyNewsCache = [];
let realEstateCache = [];
let lastChabadFetch = 0;
let lastEconomyFetch = 0;
let lastRealEstateFetch = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Source configurations
const SOURCES = {
  col: {
    name: 'חב״ד און ליין',
    icon: '📰',
    color: '1a365d',
    textColor: 'ffffff',
  },
  chabadUpdates: {
    name: 'עדכוני חב"ד',
    icon: '📰',
    color: '2d5a27',
    textColor: 'ffffff',
  },
  bizzness: {
    name: 'ביזנעס',
    icon: '💰',
    color: '8b4513',
    textColor: 'ffffff',
  },
};

// ============ CHABAD NEWS ============
export async function fetchChabadNews() {
  if (Date.now() - lastChabadFetch < CACHE_DURATION && chabadNewsCache.length > 0) {
    console.log('Serving Chabad news from cache');
    return chabadNewsCache;
  }

  console.log('Fetching Chabad news...');
  
  const [colItems, chabadUpdatesItems] = await Promise.all([
    fetchFromUrl('https://col.org.il/main', 'https://col.org.il', SOURCES.col, 5),
    fetchFromUrl('https://chabadupdates.com/', 'https://chabadupdates.com', SOURCES.chabadUpdates, 5),
  ]);
  
  chabadNewsCache = [...colItems, ...chabadUpdatesItems]
    .slice(0, 10)
    .map((item) => ({
      ...item,
      id: createStableId('chabad', item.title),
      topic: 'חדשות חב״ד',
      content: item.summary || item.title, // Ensure content exists for article view
    }));
  
  lastChabadFetch = Date.now();
  console.log(`Cached ${chabadNewsCache.length} Chabad headlines`);
  
  return chabadNewsCache;
}

// ============ ECONOMY NEWS ============
export async function fetchEconomyNews() {
  if (Date.now() - lastEconomyFetch < CACHE_DURATION && economyNewsCache.length > 0) {
    console.log('Serving Economy news from cache');
    return economyNewsCache;
  }

  console.log('Fetching Economy news from bizzness.net...');
  
  try {
    const response = await fetch('https://bizzness.net/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'text/html',
      }
    });
    const html = await response.text();
    const articleLinks = extractBizznessLinks(html);
    
    // Fetch content for each article (limit to 8)
    const articles = [];
    for (const link of articleLinks.slice(0, 16)) {
      try {
        const articleData = await fetchBizznessArticle(link.url, link.imageUrl);
        if (articleData) {
          articles.push(articleData);
        }
      } catch (e) {
        console.error(`Error fetching article ${link.url}:`, e.message);
      }
    }
    
    economyNewsCache = articles.map((item) => ({
      ...item,
      id: createStableId('economy', item.title),
      topic: 'חדשות כלכלה',
      isExternal: false,
    }));
    
    lastEconomyFetch = Date.now();
    console.log(`Cached ${economyNewsCache.length} Economy articles`);
  } catch (error) {
    console.error('Error fetching Economy news:', error.message);
  }
  
  return economyNewsCache;
}

// Extract article links from bizzness.net homepage
function extractBizznessLinks(html) {
  const links = [];
  const seen = new Set();
  
  const pattern = /<a\s+href="(https:\/\/bizzness\.net\/[^"]+\/)"[^>]*>\s*<img[^>]+data-lazy-src="([^"]+)"/gi;
  
  let match;
  while ((match = pattern.exec(html)) !== null && links.length < 20) {
    const articleUrl = match[1];
    const imageUrl = match[2];
    
    // Skip category/navigation pages
    if (articleUrl.includes('/category/') || articleUrl.includes('/author/')) continue;
    
    if (!seen.has(articleUrl)) {
      seen.add(articleUrl);
      links.push({ url: articleUrl, imageUrl });
    }
  }
  
  return links;
}

// Fetch individual article page to get content
async function fetchBizznessArticle(url, imageUrl) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Accept': 'text/html',
    }
  });
  const html = await response.text();
  
  // Extract title from URL
  const urlPath = url.replace('https://bizzness.net/', '').replace(/\/$/, '');
  const title = decodeURIComponent(urlPath).replace(/-/g, ' ');
  
  if (isNavigationText(title) || title.length < 10) return null;
  
  // Extract content from entry-content div
  const contentMatch = html.match(/<div class="row entry-content">([\s\S]*?)<\/div><!-- \.entry-content -->/);
  let content = '';
  
  if (contentMatch) {
    // Extract all paragraphs from content
    const paragraphs = contentMatch[1].match(/<p>([^<]+)<\/p>/g);
    if (paragraphs) {
      content = paragraphs
        .map(p => cleanText(p.replace(/<\/?p>/g, '')))
        .filter(p => p.length > 20)
        .join('\n\n');
    }
  }
  
  // Fallback: try to find any substantial paragraph
  if (!content) {
    const pMatch = html.match(/<p>([^<]{50,500})<\/p>/);
    if (pMatch) {
      content = cleanText(pMatch[1]);
    }
  }
  
  if (!content || content.length < 30) return null;
  
  return {
    title: title.substring(0, 80),
    summary: content.substring(0, 150) + '...',
    content: content,
    imageUrl: imageUrl,
    date: new Date().toISOString(),
  };
}

// ============ REAL ESTATE - LOD ============
export async function fetchRealEstate() {
  if (Date.now() - lastRealEstateFetch < CACHE_DURATION && realEstateCache.length > 0) {
    console.log('Serving Real Estate from cache');
    return realEstateCache;
  }

  console.log('Fetching Real Estate from madlan.co.il...');
  
  try {
    const response = await fetch('https://www.madlan.co.il/for-sale/%D7%91%D7%A2%D7%9C-%D7%94%D7%AA%D7%A0%D7%99%D7%90-%D7%9C%D7%95%D7%93-%D7%99%D7%A9%D7%A8%D7%90%D7%9C', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'text/html',
      }
    });
    const html = await response.text();
    
    // Extract property objects from JSON
    // Pattern: "address":"...","matchScore":null,"beds":X,"floor":"Y",...,"area":Z,"price":N
    const propertyPattern = /"address":"([^"]+)"[^}]*?"beds":([\d.]+)[^}]*?"floor":"?(\d+)"?[^}]*?"area":(\d+)[^}]*?"price":(\d+)/g;
    
    const properties = [];
    const seen = new Set();
    let match;
    
    while ((match = propertyPattern.exec(html)) !== null && properties.length < 10) {
      const address = match[1];
      const beds = parseFloat(match[2]);
      const floor = parseInt(match[3]);
      const area = parseInt(match[4]);
      const price = parseInt(match[5]);
      
      // Skip duplicates
      if (seen.has(address)) continue;
      seen.add(address);
      
      if (price > 0) {
        const priceFormatted = new Intl.NumberFormat('he-IL').format(price);
        properties.push({
          title: address,
          summary: `${beds} חדרים | קומה ${floor} | ${area} מ"ר | ₪${priceFormatted}`,
          content: `כתובת: ${address}\n\nמחיר: ₪${priceFormatted}\nחדרים: ${beds}\nקומה: ${floor}\nשטח: ${area} מ"ר`,
          imageUrl: null,
          date: new Date().toISOString(),
        });
      }
    }
    
    realEstateCache = properties.map((item) => ({
      ...item,
      id: createStableId('realestate', item.title),
      topic: 'נדל״ן בלוד',
      isExternal: false,
    }));
    
    lastRealEstateFetch = Date.now();
    console.log(`Cached ${realEstateCache.length} Real Estate listings`);
  } catch (error) {
    console.error('Error fetching Real Estate:', error.message);
  }
  
  return realEstateCache;
}

// ============ FETCH HELPER ============
async function fetchFromUrl(url, baseUrl, source, limit) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'text/html',
      }
    });
    const html = await response.text();
    return extractHeadlines(html, baseUrl, source, limit);
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error.message);
    return [];
  }
}

// Extract only headlines and links
function extractHeadlines(html, baseUrl, source, limit) {
  const items = [];
  const seen = new Set();
  
  const patterns = [
    /<a[^>]*href="([^"]+)"[^>]*>([^<]{20,120})<\/a>/gi,
    /<h[123][^>]*>([^<]{20,120})<\/h[123]>/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && items.length < limit) {
      let link = match[1] || baseUrl;
      const title = cleanText(match[2] || match[1]);
      
      if (isNavigationText(title)) continue;
      
      if (link && !link.startsWith('http')) {
        link = baseUrl + (link.startsWith('/') ? '' : '/') + link;
      }
      
      if (title && title.length > 20 && !seen.has(title)) {
        seen.add(title);
        items.push({
          title: title.substring(0, 80),
          summary: `מקור: ${source.name} | לחץ לקריאת הכתבה המלאה`,
          link: link || baseUrl,
          imageUrl: null,
          date: new Date().toISOString(),
          isExternal: true,
        });
      }
    }
  }
  
  return items;
}

function isNavigationText(text) {
  const navTerms = [
    // Navigation
    'חדשות', 'ראשי', 'צור קשר', 'אודות', 'חיפוש', 'תפריט',
    'הרשם', 'התחבר', 'שלח', 'קרא עוד', 'לקריאה',
    // Social
    'facebook', 'youtube', 'telegram', 'instagram', 'twitter', 'tiktok',
    // Categories
    'חב"ד בארץ', 'חב"ד בעולם', 'גלריות', 'שמחות', 'מבצעים',
    'כלכלה', 'נדל"ן', 'פיננסים', 'טכנולוגי', 'רכב', 'מגזין',
    'טורים', 'פרויקטים', 'לוח', 'בארץ', 'בעולם',
    // Promotional / CTA (not articles)
    'הוסיפו', 'הוסף', 'פרסמו', 'פרסם', 'שלחו', 'העלו', 'הגישו',
    'האירוע שלכם', 'הכתבה שלכם', 'המודעה שלכם', 'התמונה שלכם',
    'לפרסום', 'להוספה', 'להעלאה', 'להגשה', 'לשליחה',
    'הירשמו', 'הצטרפו', 'הרשמה', 'הצטרפות',
    'לחצו כאן', 'קליק', 'לחץ',
    'פרסום באתר', 'מודעה באתר', 'שידור חי',
  ];
  const lowerText = text.toLowerCase();
  // Check if text matches any nav term or contains promotional keywords
  return navTerms.some(term => lowerText.includes(term)) || lowerText.length < 15;
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

