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
  'קריית גת', 'קריית מלאכי', 'קריית שמונה', 'קריית ביאליק', 'קריית ים', 'קריית אתא',
  'אילת', 'עפולה', 'נצרת', 'כרמיאל', 'טבריה', 'צפת', 'דימונה',
  'אלעד', 'ביתר עילית', 'מודיעין עילית', 'עמנואל', 'קריית ספר',
  'אריאל', 'מעלה אדומים', 'גבעת זאב', 'אפרת', 'קרית ארבע',
  'מגדל העמק', 'אחיסמך', 'יבנה', 'נס ציונה', 'אור יהודה', 'יהוד', 'גני תקווה',
  'כפר חב״ד', 'כפר חבד', 'נחלת הר חב״ד', 'נחלת הר חבד',
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
  'דירה': { bg: '4A90A4', icon: '🏠' },
  'דירות למכירה': { bg: '3B82F6', icon: '🏡' },
  'דירות להשכרה': { bg: '6366F1', icon: '🏢' },
  'משרות': { bg: '7B68A6', icon: '💼' },
  'משרה': { bg: '7B68A6', icon: '💼' },
  'רכבים': { bg: '5D8AA8', icon: '🚗' },
  'רכב': { bg: '5D8AA8', icon: '🚗' },
  'ריהוט': { bg: 'A67B5B', icon: '🪑' },
  'אלקטרוניקה': { bg: '708090', icon: '📱' },
  'ביגוד': { bg: 'C08081', icon: '👔' },
  'ספרים': { bg: '8B7355', icon: '📚' },
  'כללי': { bg: '6B8E6B', icon: '📦' },
  'חדשות חב״ד': { bg: '7C3AED', icon: '📰' },
  'חדשות כלכלה': { bg: '059669', icon: '📈' },
  'נדל״ן בלוד': { bg: '0891B2', icon: '🏙️' },
  'נדל״ן': { bg: '0891B2', icon: '🏙️' },
  'קבוצות וואטסאפ': { bg: '25D366', icon: '💬' },
  'בעלי מקצוע': { bg: 'D97706', icon: '🔧' },
};

function generateImageUrl(topic) {
  let style = topicStyles[topic];
  if (!style) {
    for (const [key, value] of Object.entries(topicStyles)) {
      if (topic?.includes(key) || key.includes(topic)) {
        style = value;
        break;
      }
    }
  }
  style = style || { bg: '64748B', icon: '📋' };
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
  let urlPart = parts[0];
  const description = parts[1] || '';
  
  // Check if this looks like a URL pattern (contains --- or __)
  const hasUrlPattern = urlPart.includes('---') || urlPart.includes('__');
  
  let url = null;
  if (hasUrlPattern) {
    url = urlPart.replace(/---/g, '://').replace(/__/g, '/');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
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
      
      // Use thumbnailLink for all images (works better with CORS)
      let imageUrl;
      if (file.thumbnailLink) {
        imageUrl = file.thumbnailLink.replace(/=s\d+/, '=s1600');
      } else {
        imageUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1600`;
      }
      
      let position = 'middle';
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('צד') || lowerName.includes('side')) position = 'side';
      else if (lowerName.includes('עליון') || lowerName.includes('top')) position = 'top';

      ads.push({ id: file.id, imageUrl, targetUrl: parsed.url, description: parsed.description || '', position });
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
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNavigationText(text) {
  const navTerms = [
    'חדשות', 'ראשי', 'צור קשר', 'אודות', 'חיפוש', 'תפריט',
    'הרשם', 'התחבר', 'שלח', 'קרא עוד', 'לקריאה',
    'facebook', 'youtube', 'telegram', 'instagram', 'twitter', 'tiktok',
    'חב"ד בארץ', 'חב"ד בעולם', 'גלריות', 'שמחות', 'מבצעים',
    'לפרסום', 'להוספה', 'לחצו כאן', 'הצטרפו',
  ];
  const lowerText = text.toLowerCase();
  return navTerms.some(term => lowerText.includes(term)) || lowerText.length < 15;
}

// Chabad News Sources
const NEWS_SOURCES = {
  col: { name: 'חב״ד און ליין', icon: '📰', color: '7C3AED' },
  chabadUpdates: { name: 'עדכוני חב"ד', icon: '📰', color: '7C3AED' },
};

async function fetchChabadNews() {
  console.log('Fetching Chabad news...');
  
  try {
    const [colItems, updatesItems] = await Promise.all([
      fetchHeadlinesFromUrl('https://col.org.il/main', 'https://col.org.il', NEWS_SOURCES.col, 5),
      fetchHeadlinesFromUrl('https://chabadupdates.com/', 'https://chabadupdates.com', NEWS_SOURCES.chabadUpdates, 5),
    ]);
    
    const allItems = [...colItems, ...updatesItems].slice(0, 10).map(item => ({
      ...item,
      id: createStableId('chabad', item.title),
      topic: 'חדשות חב״ד',
      content: item.summary || item.title,
    }));
    
    console.log(`Fetched ${allItems.length} Chabad headlines`);
    return allItems;
  } catch (error) {
    console.error('Error fetching Chabad news:', error.message);
    return [];
  }
}

async function fetchHeadlinesFromUrl(url, baseUrl, source, limit) {
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
          imageUrl: `https://placehold.co/800x400/${source.color}/ffffff?text=${encodeURIComponent(source.icon)}`,
          date: new Date().toISOString(),
          isExternal: true,
        });
      }
    }
  }
  
  return items;
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
    while ((match = pattern.exec(html)) !== null && links.length < 20) {
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
    for (const link of links.slice(0, 16)) {
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

// ============ PROFESSIONALS ============
const PROFESSIONALS_FOLDER_NAME = 'בעלי מקצוע';

async function findProfessionalsFolder() {
  const response = await drive.files.list({
    key: API_KEY,
    q: `'${FOLDER_ID}' in parents and name='${PROFESSIONALS_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });
  return response.data.files?.[0] || null;
}

async function getImageFiles(folderId) {
  const response = await drive.files.list({
    key: API_KEY,
    q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`,
    fields: 'files(id, name)',
  });
  
  const imageMap = {};
  for (const file of response.data.files || []) {
    const match = file.name.match(/^(\d+)\./);
    if (match) {
      imageMap[match[1]] = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`;
    }
  }
  return imageMap;
}

function parseProfessionalSection(content, sectionNumber) {
  const lines = content.split('\n').filter(line => line.trim());
  let name = null, city = null, profession = null, phone = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^שם[:\s]/i)) {
      name = trimmed.replace(/^שם[:\s]*/i, '').trim();
    } else if (trimmed.match(/^עיר[:\s]/i)) {
      city = trimmed.replace(/^עיר[:\s]*/i, '').trim();
    } else if (trimmed.match(/^מקצוע[:\s]/i)) {
      profession = trimmed.replace(/^מקצוע[:\s]*/i, '').trim();
    } else if (trimmed.match(/^(?:טלפון|נייד|פלאפון)[:\s]/i)) {
      phone = trimmed.replace(/^(?:טלפון|נייד|פלאפון)[:\s]*/i, '').trim();
    } else {
      const phoneMatch = trimmed.match(/0\d{1,2}[-\s]?\d{7,8}|05\d[-\s]?\d{3}[-\s]?\d{4}/);
      if (phoneMatch && !phone) phone = phoneMatch[0];
      if (!name && trimmed.length > 0 && !trimmed.includes(':')) name = trimmed;
      else if (name && !profession && trimmed.length > 0 && !trimmed.includes(':')) profession = trimmed;
    }
  }
  
  return {
    id: `professional-${sectionNumber}`,
    number: sectionNumber,
    name: name || `בעל מקצוע ${sectionNumber}`,
    city: city || null,
    profession: profession || null,
    phone: phone || null,
  };
}

async function fetchProfessionals() {
  try {
    const professionalsFolder = await findProfessionalsFolder();
    if (!professionalsFolder) return [];

    const response = await drive.files.list({
      key: API_KEY,
      q: `'${professionalsFolder.id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'files(id, name)',
    });

    const professionalsDoc = response.data.files?.find(f => f.name.includes('בעלי מקצוע') || f.name.includes('מקצוע'));
    if (!professionalsDoc) return [];

    const [content, imageMap] = await Promise.all([
      getDocContent(professionalsDoc.id),
      getImageFiles(professionalsFolder.id),
    ]);

    const sections = content.split(/(?=^##\s*\d+)/m);
    const professionals = [];

    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;
      const headingMatch = trimmed.match(/^##\s*(\d+)/);
      if (!headingMatch) continue;
      const sectionNumber = headingMatch[1];
      const sectionContent = trimmed.replace(/^##\s*\d+\s*/, '').trim();
      const professional = parseProfessionalSection(sectionContent, sectionNumber);
      professional.imageUrl = imageMap[sectionNumber] || null;
      professionals.push(professional);
    }

    return professionals;
  } catch (error) {
    console.error('Error fetching professionals:', error.message);
    return [];
  }
}

// ============ CACHE ============
let articlesCache = [];
let adsCache = [];
let pageAdsCache = [];
let professionalsCache = [];
let lastFetchTime = 0;
let professionalsLastFetch = 0;
const CACHE_DURATION = 60 * 60 * 1000;

function isCacheValid() {
  return Date.now() - lastFetchTime < CACHE_DURATION && articlesCache.length > 0;
}

async function loadAllContent(forceRefresh = false) {
  if (!forceRefresh && isCacheValid()) {
    return articlesCache;
  }

  const [driveArticles, chabadNews, economyNews, whatsappGroups] = await Promise.all([
    listAllArticles(),
    fetchChabadNews(),
    fetchEconomyNews(),
    fetchWhatsAppGroups(),
  ]);

  let allArticles = [...driveArticles, ...chabadNews, ...economyNews, ...whatsappGroups];

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

// ============ PROFESSIONALS ============
async function loadProfessionals(forceRefresh = false) {
  if (!forceRefresh && professionalsCache.length > 0 && Date.now() - professionalsLastFetch < CACHE_DURATION) {
    return professionalsCache;
  }
  professionalsCache = await fetchProfessionals();
  professionalsLastFetch = Date.now();
  return professionalsCache;
}

app.get('/api/professionals', async (req, res) => {
  try {
    const { city, profession } = req.query;
    let professionals = await loadProfessionals();
    if (city) professionals = professionals.filter(p => p.city === city);
    if (profession) professionals = professionals.filter(p => p.profession === profession);
    res.json(professionals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/professionals/cities', async (req, res) => {
  try {
    const professionals = await loadProfessionals();
    const cities = [...new Set(professionals.map(p => p.city).filter(Boolean))].sort();
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/professionals/professions', async (req, res) => {
  try {
    const professionals = await loadProfessionals();
    const professions = [...new Set(professionals.map(p => p.profession).filter(Boolean))].sort();
    res.json(professions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN ============
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const adminSessions = new Set();
let submissions = [];

function generateAdminToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function requireAdminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }
  
  if (password === ADMIN_PASSWORD) {
    const token = generateAdminToken();
    adminSessions.add(token);
    setTimeout(() => adminSessions.delete(token), 24 * 60 * 60 * 1000);
    return res.json({ token });
  }
  
  return res.status(401).json({ error: 'Invalid password' });
});

app.post('/api/admin/submit', (req, res) => {
  try {
    const { category, title, content, contact } = req.body;
    if (!category || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const submission = {
      id: Date.now().toString(),
      category,
      title,
      content,
      contact: contact || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    submissions.push(submission);
    res.json({ message: 'Submission received', id: submission.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit' });
  }
});

app.get('/api/admin/submissions', requireAdminAuth, (req, res) => {
  res.json(submissions);
});

app.post('/api/admin/submissions/:id/approve', requireAdminAuth, async (req, res) => {
  const submission = submissions.find(s => s.id === req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  const formattedContent = `## ${submission.title}\n${submission.content}${submission.contact ? `\n\nליצירת קשר: ${submission.contact}` : ''}`;
  submissions = submissions.filter(s => s.id !== req.params.id);
  
  res.json({ 
    message: 'Submission approved',
    published: false,
    category: submission.category,
    formattedContent,
    instructions: `העתק את התוכן למסמך "${submission.category}" בגוגל דרייב`
  });
});

app.delete('/api/admin/submissions/:id', requireAdminAuth, (req, res) => {
  const index = submissions.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  submissions.splice(index, 1);
  res.json({ message: 'Submission deleted' });
});

export default app;

