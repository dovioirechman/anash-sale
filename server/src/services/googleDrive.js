import { google } from 'googleapis';
import { config } from '../config/index.js';
import crypto from 'crypto';

const drive = google.drive({
  version: 'v3',
});

const sheets = google.sheets({
  version: 'v4',
});

const FOLDER_ID = '1hBWqhB0hVJvJH0o_7wQtuxoweXAIofJC';
const API_KEY = config.google.apiKey;

// Helper to create stable ID
function createStableId(prefix, text) {
  const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
  return `${prefix}-${hash}`;
}

// Map Hebrew topics to colors and icons for themed images
const topicStyles = {
  'דירות': { bg: '4A90A4', icon: '🏠', label: 'דירה' },
  'דירה': { bg: '4A90A4', icon: '🏠', label: 'דירה' },
  'משרות': { bg: '7B68A6', icon: '💼', label: 'משרה' },
  'משרה': { bg: '7B68A6', icon: '💼', label: 'משרה' },
  'רכבים': { bg: '5D8AA8', icon: '🚗', label: 'רכב' },
  'רכב': { bg: '5D8AA8', icon: '🚗', label: 'רכב' },
  'ריהוט': { bg: 'A67B5B', icon: '🪑', label: 'ריהוט' },
  'אלקטרוניקה': { bg: '708090', icon: '📱', label: 'אלקטרוניקה' },
  'ביגוד': { bg: 'C08081', icon: '👔', label: 'ביגוד' },
  'ספרים': { bg: '8B7355', icon: '📚', label: 'ספרים' },
  'כללי': { bg: '6B8E6B', icon: '📦', label: 'כללי' },
};

// Generate themed placeholder image with icon
function generateImageUrl(topic, articleId) {
  const style = topicStyles[topic] || { bg: '81B29A', icon: '📦', label: 'מודעה' };
  // Using placehold.co for simple colored placeholders with text
  return `https://placehold.co/800x400/${style.bg}/ffffff?text=${encodeURIComponent(style.icon)}`;
}

// Get content of a Google Doc
async function getDocContent(fileId) {
  const response = await drive.files.export({
    key: API_KEY,
    fileId,
    mimeType: 'text/plain',
  });
  return response.data;
}

// Parse posts from a single doc content (split by ## headings)
function parsePostsFromDoc(content, topic, docId) {
  const posts = [];

  // Split by ## headings
  const sections = content.split(/(?=^## )/m);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    // Check if section starts with ##
    const headingMatch = section.match(/^## (.+)/);
    if (!headingMatch) continue;

    // Get the content after the ## heading
    const body = section.replace(/^## .+\n?/, '').trim();
    if (!body) continue;

    // Use first line of content as title (up to 60 chars)
    const lines = body.split('\n').filter(line => line.trim());
    const firstLine = lines[0] || '';
    const title = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
    
    // Rest of content (including first line for full view)
    const fullContent = body;

    if (!title) continue;

    // Create unique ID from doc ID and post index
    const postId = `${docId}-${i}`;

    posts.push({
      id: postId,
      title,
      content: fullContent,
      topic,
      date: new Date().toISOString(),
      imageUrl: generateImageUrl(topic, postId),
    });
  }

  return posts;
}

// List all articles - each doc in main folder is a category
export async function listAllArticles() {
  const allArticles = [];

  // Get all docs directly from the main folder (each doc = one category)
  const response = await drive.files.list({
    key: API_KEY,
    q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id, name, createdTime)',
  });

  // Process each doc - doc name is the category/topic name
  for (const doc of response.data.files) {
    try {
      const content = await getDocContent(doc.id);
      const topicName = doc.name; // Doc name = category name
      const posts = parsePostsFromDoc(content, topicName, doc.id);
      allArticles.push(...posts);
    } catch (error) {
      console.error(`Error processing doc ${doc.name}:`, error.message);
    }
  }

  return allArticles;
}

// Get article by ID (article is already in cache with content)
export async function getArticleById(articleId, articlesCache) {
  return articlesCache.find(a => a.id === articleId);
}

// Fetch WhatsApp groups from Google Sheet
export async function fetchWhatsAppGroups() {
  console.log('Fetching WhatsApp groups...');
  try {
    // First, find all spreadsheet files
    const response = await drive.files.list({
      key: API_KEY,
      q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name)',
    });

    console.log('Found spreadsheets:', response.data.files?.map(f => f.name) || 'none');

    const sheetFile = response.data.files?.find(f => 
      f.name.includes('וואטסאפ') || f.name.includes('whatsapp') || f.name.includes('קבוצות')
    );
    
    if (!sheetFile) {
      console.log('WhatsApp groups sheet not found in folder');
      return [];
    }

    console.log('Using sheet:', sheetFile.name, sheetFile.id);

    // Fetch sheet data
    const sheetData = await sheets.spreadsheets.values.get({
      key: API_KEY,
      spreadsheetId: sheetFile.id,
      range: 'A:B', // First two columns
    });

    const rows = sheetData.data.values || [];
    console.log('Sheet rows:', rows.length);
    
    const groups = [];

    for (const row of rows) {
      const name = row[0]?.trim();
      const link = row[1]?.trim();
      
      // Accept any WhatsApp link format
      if (name && link && (link.includes('whatsapp.com') || link.includes('wa.me'))) {
        groups.push({
          id: createStableId('whatsapp', name),
          title: name,
          summary: 'לחץ להצטרפות לקבוצה',
          content: `קבוצת וואטסאפ: ${name}\n\nלחץ להצטרפות לקבוצה`,
          link: link,
          topic: 'קבוצות וואטסאפ',
          date: new Date().toISOString(),
          imageUrl: 'https://placehold.co/800x400/25D366/ffffff?text=📱',
          isExternal: true,
        });
      }
    }

    console.log(`Found ${groups.length} WhatsApp groups`);
    return groups;
  } catch (error) {
    console.error('Error fetching WhatsApp groups:', error.message);
    return [];
  }
}

// ========== WRITE FUNCTIONALITY (requires Service Account) ==========

// Get authenticated drive client using service account
function getAuthenticatedDrive() {
  if (!config.google.serviceAccount) {
    throw new Error('Service account credentials not configured');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: config.google.serviceAccount,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

// Find document by category name
async function findDocByCategory(category) {
  const authDrive = getAuthenticatedDrive();
  const folderId = config.google.folderId;

  const response = await authDrive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and name='${category}' and trashed=false`,
    fields: 'files(id, name)',
  });

  return response.data.files?.[0] || null;
}

// Create a new document for a category
async function createDocForCategory(category) {
  const authDrive = getAuthenticatedDrive();
  const folderId = config.google.folderId;

  const fileMetadata = {
    name: category,
    mimeType: 'application/vnd.google-apps.document',
    parents: [folderId],
  };

  const response = await authDrive.files.create({
    resource: fileMetadata,
    fields: 'id, name',
  });

  return response.data;
}

// Append content to a Google Doc
export async function appendToGoogleDoc(category, title, content, contact) {
  try {
    console.log(`Appending to Google Doc for category: ${category}`);

    // Find or create the document
    let doc = await findDocByCategory(category);
    
    if (!doc) {
      console.log(`Creating new document for category: ${category}`);
      doc = await createDocForCategory(category);
    }

    // Format the content
    const formattedContent = `\n\n## ${title}\n${content}${contact ? `\n\nליצירת קשר: ${contact}` : ''}\n`;

    // Get authenticated docs client
    const auth = new google.auth.GoogleAuth({
      credentials: config.google.serviceAccount,
      scopes: ['https://www.googleapis.com/auth/documents'],
    });
    
    const docs = google.docs({ version: 'v1', auth });

    // Get document to find the end index
    const docData = await docs.documents.get({ documentId: doc.id });
    const endIndex = docData.data.body.content[docData.data.body.content.length - 1].endIndex - 1;

    // Insert text at the end
    await docs.documents.batchUpdate({
      documentId: doc.id,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: endIndex },
              text: formattedContent,
            },
          },
        ],
      },
    });

    console.log(`Successfully appended to document: ${doc.name}`);
    return true;
  } catch (error) {
    console.error('Error appending to Google Doc:', error.message);
    throw error;
  }
}
