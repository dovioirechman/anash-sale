import { google } from 'googleapis';
import { config } from '../config/index.js';

const drive = google.drive({ version: 'v3' });

const FOLDER_ID = '1hBWqhB0hVJvJH0o_7wQtuxoweXAIofJC';
const API_KEY = config.google.apiKey;

// Parse filename to extract URL
// Format: "https---example.com__path__page___description.png"
// Converts to: "https://example.com/path/page"
function parseAdFilename(filename) {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  
  // Split by ___ (triple underscore) to separate URL from description
  const parts = nameWithoutExt.split('___');
  if (parts.length < 1) return null;
  
  let urlPart = parts[0];
  const description = parts[1] || '';
  
  // Convert back to proper URL
  // --- becomes ://
  // __ becomes /
  let url = urlPart
    .replace(/---/g, '://')
    .replace(/__/g, '/');
  
  // Add https if no protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return { url, description };
}

// Fetch ads from a specific folder
async function fetchAdsFromFolder(folderName) {
  try {
    // Find the folder
    const foldersResponse = await drive.files.list({
      key: API_KEY,
      q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name contains '${folderName}' and trashed=false`,
      fields: 'files(id, name)',
    });

    const adsFolder = foldersResponse.data.files?.[0];
    if (!adsFolder) {
      console.log(`${folderName} folder not found`);
      return [];
    }

    console.log('Found folder:', adsFolder.name);

    // Get all image files from the ads folder
    const imagesResponse = await drive.files.list({
      key: API_KEY,
      q: `'${adsFolder.id}' in parents and (mimeType contains 'image/') and trashed=false`,
      fields: 'files(id, name, mimeType, webContentLink, thumbnailLink)',
    });

    const ads = [];
    
    for (const file of imagesResponse.data.files || []) {
      const parsed = parseAdFilename(file.name);
      if (!parsed) continue;

      // For GIFs, use direct link to preserve animation
      const isGif = file.mimeType === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
      let imageUrl;
      if (isGif) {
        imageUrl = `https://drive.google.com/uc?export=view&id=${file.id}`;
      } else if (file.thumbnailLink) {
        imageUrl = file.thumbnailLink.replace(/=s\d+/, '=s1000');
      } else {
        imageUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`;
      }
      
      console.log(`Ad: ${file.name} -> ${imageUrl}`);
      
      // Determine ad position based on filename keywords
      let position = 'middle'; // default
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('side') || lowerName.includes('צד')) {
        position = 'side';
      } else if (lowerName.includes('top') || lowerName.includes('עליון')) {
        position = 'top';
      } else if (lowerName.includes('bottom') || lowerName.includes('תחתון')) {
        position = 'bottom';
      }

      ads.push({
        id: file.id,
        imageUrl,
        targetUrl: parsed.url,
        description: parsed.description,
        position,
      });
    }

    console.log(`Found ${ads.length} ads in ${folderName}`);
    return ads;
  } catch (error) {
    console.error(`Error fetching ads from ${folderName}:`, error.message);
    return [];
  }
}

// Fetch banner ads (top, middle, sidebar) from "מודעות" folder
export async function fetchAds() {
  return fetchAdsFromFolder('מודעות');
}

// Fetch page ads from "עמוד מודעות" folder (for main ads tab)
export async function fetchPageAds() {
  return fetchAdsFromFolder('עמוד מודעות');
}

