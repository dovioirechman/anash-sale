import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Import services
import { google } from 'googleapis';

const drive = google.drive({ version: 'v3' });
const sheets = google.sheets({ version: 'v4' });

const FOLDER_ID = '1hBWqhB0hVJvJH0o_7wQtuxoweXAIofJC';
const API_KEY = process.env.GOOGLE_API_KEY;

// ============ CITY DETECTION ============
const ISRAELI_CITIES = [
  'ירושלים', 'תל אביב', 'חיפה', 'באר שבע', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'נתניה',
  'בני ברק', 'חולון', 'רמת גן', 'אשקלון', 'בת ים', 'רחובות', 'הרצליה', 'כפר סבא',
  'חדרה', 'בית שמש', 'מודיעין', 'רעננה', 'לוד', 'רמלה', 'גבעתיים', 'נהריה', 'עכו',
  'קריית גת', 'אילת', 'עפולה', 'נצרת', 'כרמיאל', 'טבריה', 'צפת', 'דימונה',
  'אלעד', 'ביתר עילית', 'מודיעין עילית', 'עמנואל', 'קריית ספר',
  'אריאל', 'מעלה אדומים', 'גבעת זאב', 'אפרת', 'קרית ארבע',
];

const APARTMENT_CATEGORIES = ['דירות להשכרה', 'דירות למכירה', 'דירות', 'נדל״ן', 'נדל"ן', 'נדל״ן בלוד'];

function detectCity(text) {
  if (!text) return null;
  for (const city of ISRAELI_CITIES) {
    if (text.includes(city)) return city;
  }
  return null;
}

function isApartmentCategory(topic) {
  return APARTMENT_CATEGORIES.some(cat => topic?.includes(cat) || cat.includes(topic));
}

// ============ GOOGLE DRIVE ============
import crypto from 'crypto';

function createStableId(prefix, text) {
  const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
  return `${prefix}-${hash}`;
}

const topicStyles = {
  'דירות': { bg: '4A90A4', icon: '🏠' },
  'משרות': { bg: '7B68A6', icon: '💼' },
  'רכבים': { bg: '5D8AA8', icon: '🚗' },
  'ריהוט': { bg: 'A67B5B', icon: '🪑' },
};

function generateImageUrl(topic) {
  const style = topicStyles[topic] || { bg: '81B29A', icon: '📦' };
  return `https://placehold.co/800x400/${style.bg}/ffffff?text=${encodeURIComponent(style.icon)}`;
}

async function getDocContent(fileId) {
  const response = await drive.files.export({ key: API_KEY, fileId, mimeType: 'text/plain' });
  return response.data;
}

function parsePostsFromDoc(content, topic, docId) {
  const posts = [];
  const sections = content.split(/(?=^## )/m);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;
    const headingMatch = section.match(/^## (.+)/);
    if (!headingMatch) continue;
    const body = section.replace(/^## .+\n?/, '').trim();
    if (!body) continue;
    const lines = body.split('\n').filter(line => line.trim());
    const firstLine = lines[0] || '';
    const title = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
    if (!title) continue;
    const postId = `${docId}-${i}`;
    posts.push({
      id: postId,
      title,
      content: body,
      topic,
      date: new Date().toISOString(),
      imageUrl: generateImageUrl(topic),
    });
  }
  return posts;
}

async function listAllArticles() {
  const allArticles = [];
  const response = await drive.files.list({
    key: API_KEY,
    q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id, name, createdTime)',
  });

  for (const doc of response.data.files) {
    try {
      const content = await getDocContent(doc.id);
      const posts = parsePostsFromDoc(content, doc.name, doc.id);
      allArticles.push(...posts);
    } catch (error) {
      console.error(`Error processing doc ${doc.name}:`, error.message);
    }
  }
  return allArticles;
}

async function fetchWhatsAppGroups() {
  try {
    const response = await drive.files.list({
      key: API_KEY,
      q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name)',
    });

    const sheetFile = response.data.files?.find(f => f.name.includes('וואטסאפ') || f.name.includes('קבוצות'));
    if (!sheetFile) return [];

    const sheetData = await sheets.spreadsheets.values.get({
      key: API_KEY,
      spreadsheetId: sheetFile.id,
      range: 'A:B',
    });

    const rows = sheetData.data.values || [];
    const groups = [];

    for (const row of rows) {
      const name = row[0]?.trim();
      const link = row[1]?.trim();
      if (name && link && (link.includes('whatsapp.com') || link.includes('wa.me'))) {
        groups.push({
          id: createStableId('whatsapp', name),
          title: name,
          summary: 'לחץ להצטרפות לקבוצה',
          content: `קבוצת וואטסאפ: ${name}`,
          link,
          topic: 'קבוצות וואטסאפ',
          date: new Date().toISOString(),
          imageUrl: 'https://placehold.co/800x400/25D366/ffffff?text=📱',
          isExternal: true,
        });
      }
    }
    return groups;
  } catch (error) {
    console.error('Error fetching WhatsApp groups:', error.message);
    return [];
  }
}

// ============ ADS ============
function parseAdFilename(filename) {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  const parts = nameWithoutExt.split('___');
  if (parts.length < 1) return null;
  let urlPart = parts[0];
  const description = parts[1] || '';
  let url = urlPart.replace(/---/g, '://').replace(/__/g, '/');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return { url, description };
}

async function fetchAdsFromFolder(folderName) {
  try {
    const foldersResponse = await drive.files.list({
      key: API_KEY,
      q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${folderName}' and trashed=false`,
      fields: 'files(id, name)',
    });

    const adsFolder = foldersResponse.data.files?.[0];
    if (!adsFolder) return [];

    const imagesResponse = await drive.files.list({
      key: API_KEY,
      q: `'${adsFolder.id}' in parents and (mimeType contains 'image/') and trashed=false`,
      fields: 'files(id, name, mimeType, thumbnailLink)',
    });

    const ads = [];
    for (const file of imagesResponse.data.files || []) {
      const parsed = parseAdFilename(file.name);
      if (!parsed) continue;
      let imageUrl = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s1600') : `https://drive.google.com/uc?export=view&id=${file.id}`;
      
      let position = 'middle';
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('צד') || lowerName.includes('side')) position = 'side';
      else if (lowerName.includes('עליון') || lowerName.includes('top')) position = 'top';

      ads.push({ id: file.id, imageUrl, targetUrl: parsed.url, description: parsed.description, position });
    }
    return ads;
  } catch (error) {
    console.error('Error fetching ads:', error.message);
    return [];
  }
}

// ============ NEWS SERVICES ============

// Helper to clean HTML text
function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNavigationText(text) {
  const navPatterns = ['חדשות', 'כתבות', 'עמוד הבית', 'אודות', 'צור קשר', 'תפריט'];
  return navPatterns.some(p => text === p || text.length < 5);
}

async function fetchEconomyNews() {
  console.log('Fetching Economy news from bizzness.net...');
  
  try {
    const response = await fetch('https://bizzness.net/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'text/html',
      }
    });
    const html = await response.text();
    
    // Extract article links
    const links = [];
    const seen = new Set();
    const pattern = /<a\s+href="(https:\/\/bizzness\.net\/[^"]+\/)"[^>]*>\s*<img[^>]+data-lazy-src="([^"]+)"/gi;
    
    let match;
    while ((match = pattern.exec(html)) !== null && links.length < 8) {
      const articleUrl = match[1];
      const imageUrl = match[2];
      if (articleUrl.includes('/category/') || articleUrl.includes('/author/')) continue;
      if (!seen.has(articleUrl)) {
        seen.add(articleUrl);
        links.push({ url: articleUrl, imageUrl });
      }
    }
    
    // Fetch each article
    const articles = [];
    for (const link of links.slice(0, 6)) {
      try {
        const artResponse = await fetch(link.url, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }
        });
        const artHtml = await artResponse.text();
        
        const urlPath = link.url.replace('https://bizzness.net/', '').replace(/\/$/, '');
        const title = decodeURIComponent(urlPath).replace(/-/g, ' ');
        
        if (isNavigationText(title) || title.length < 10) continue;
        
        const contentMatch = artHtml.match(/<div class="row entry-content">([\s\S]*?)<\/div><!-- \.entry-content -->/);
        let content = '';
        
        if (contentMatch) {
          const paragraphs = contentMatch[1].match(/<p>([^<]+)<\/p>/g);
          if (paragraphs) {
            content = paragraphs
              .map(p => cleanText(p.replace(/<\/?p>/g, '')))
              .filter(p => p.length > 20)
              .join('\n\n');
          }
        }
        
        if (!content) {
          const pMatch = artHtml.match(/<p>([^<]{50,500})<\/p>/);
          if (pMatch) content = cleanText(pMatch[1]);
        }
        
        if (content && content.length > 30) {
          articles.push({
            id: createStableId('economy', title),
            title: title.substring(0, 80),
            summary: content.substring(0, 150) + '...',
            content: content,
            imageUrl: link.imageUrl,
            date: new Date().toISOString(),
            topic: 'חדשות כלכלה',
            isExternal: false,
          });
        }
      } catch (e) {
        console.error(`Error fetching article:`, e.message);
      }
    }
    
    console.log(`Fetched ${articles.length} Economy articles`);
    return articles;
  } catch (error) {
    console.error('Error fetching Economy news:', error.message);
    return [];
  }
}

// ============ CACHE ============
let articlesCache = [];
let adsCache = [];
let pageAdsCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000;

function isCacheValid() {
  return Date.now() - lastFetchTime < CACHE_DURATION && articlesCache.length > 0;
}

async function loadAllContent(forceRefresh = false) {
  if (!forceRefresh && isCacheValid()) {
    return articlesCache;
  }

  const [driveArticles, whatsappGroups, economyNews] = await Promise.all([
    listAllArticles(),
    fetchWhatsAppGroups(),
    fetchEconomyNews(),
  ]);

  let allArticles = [...driveArticles, ...whatsappGroups, ...economyNews];

  allArticles = allArticles.map(article => {
    if (isApartmentCategory(article.topic)) {
      const city = detectCity(article.title) || detectCity(article.content);
      return { ...article, city: city || null };
    }
    return article;
  });

  articlesCache = allArticles;
  lastFetchTime = Date.now();
  return articlesCache;
}

// ============ ROUTES ============
app.get('/api/articles', async (req, res) => {
  try {
    const { topic, city } = req.query;
    let articles = await loadAllContent();
    if (topic) articles = articles.filter(a => a.topic === topic);
    if (city) articles = articles.filter(a => a.city === city);
    const articlesForList = articles.map(({ content, ...rest }) => ({
      ...rest,
      summary: rest.summary || (content ? content.substring(0, 150).trim() + '...' : ''),
    }));
    res.json(articlesForList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/topics', async (req, res) => {
  try {
    const articles = await loadAllContent();
    const topics = [...new Set(articles.map(a => a.topic))];
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/cities', async (req, res) => {
  try {
    const { topic } = req.query;
    const articles = await loadAllContent();
    let filtered = topic ? articles.filter(a => a.topic === topic) : articles;
    filtered = filtered.filter(a => isApartmentCategory(a.topic));
    const cities = [...new Set(filtered.map(a => a.city).filter(Boolean))].sort();
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const articles = await loadAllContent();
    const article = articles.find(a => a.id === req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ads', async (req, res) => {
  try {
    if (adsCache.length === 0) {
      adsCache = await fetchAdsFromFolder('מודעות');
    }
    const { position } = req.query;
    let ads = adsCache;
    if (position) ads = ads.filter(ad => ad.position === position);
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ads/page', async (req, res) => {
  try {
    if (pageAdsCache.length === 0) {
      pageAdsCache = await fetchAdsFromFolder('עמוד מודעות');
    }
    res.json(pageAdsCache);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;

