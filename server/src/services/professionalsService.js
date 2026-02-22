import { google } from 'googleapis';
import { config } from '../config/index.js';

const drive = google.drive({ version: 'v3' });

const FOLDER_ID = config.google.folderId || '1hBWqhB0hVJvJH0o_7wQtuxoweXAIofJC';
const API_KEY = config.google.apiKey;
const PROFESSIONALS_FOLDER_NAME = 'בעלי מקצוע';

async function findProfessionalsFolder() {
  const response = await drive.files.list({
    key: API_KEY,
    q: `'${FOLDER_ID}' in parents and name='${PROFESSIONALS_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });
  return response.data.files?.[0] || null;
}

async function getDocContent(fileId) {
  const response = await drive.files.export({
    key: API_KEY,
    fileId,
    mimeType: 'text/plain',
  });
  return response.data;
}

async function getImageFiles(folderId) {
  const response = await drive.files.list({
    key: API_KEY,
    q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`,
    fields: 'files(id, name, webContentLink, thumbnailLink)',
  });
  
  const imageMap = {};
  for (const file of response.data.files || []) {
    const match = file.name.match(/^(\d+)\./);
    if (match) {
      const num = match[1];
      imageMap[num] = `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`;
    }
  }
  return imageMap;
}

function parseField(text, fieldNames) {
  for (const fieldName of fieldNames) {
    const regex = new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) return match[1].trim();
  }
  return null;
}

function parseProfessionalSection(content, sectionNumber) {
  const lines = content.split('\n').filter(line => line.trim());
  
  let name = null;
  let city = null;
  let profession = null;
  let phone = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!name) {
      const nameMatch = trimmedLine.match(/^(?:שם[:\s]*)?(.+)$/);
      if (nameMatch && !trimmedLine.includes(':')) {
        name = nameMatch[1].trim();
        continue;
      }
    }
    
    if (trimmedLine.match(/^שם[:\s]/i)) {
      name = trimmedLine.replace(/^שם[:\s]*/i, '').trim();
    } else if (trimmedLine.match(/^עיר[:\s]/i)) {
      city = trimmedLine.replace(/^עיר[:\s]*/i, '').trim();
    } else if (trimmedLine.match(/^מקצוע[:\s]/i)) {
      profession = trimmedLine.replace(/^מקצוע[:\s]*/i, '').trim();
    } else if (trimmedLine.match(/^טלפון[:\s]/i) || trimmedLine.match(/^נייד[:\s]/i) || trimmedLine.match(/^פלאפון[:\s]/i)) {
      phone = trimmedLine.replace(/^(?:טלפון|נייד|פלאפון)[:\s]*/i, '').trim();
    } else {
      const phonePattern = trimmedLine.match(/0\d{1,2}[-\s]?\d{7,8}|05\d[-\s]?\d{3}[-\s]?\d{4}/);
      if (phonePattern && !phone) {
        phone = phonePattern[0];
      }
      
      if (!profession && !city && !phone && trimmedLine.length > 0) {
        if (!name) {
          name = trimmedLine;
        } else if (!profession) {
          profession = trimmedLine;
        }
      }
    }
  }
  
  if (!name && lines.length > 0) {
    name = lines[0];
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

export async function fetchProfessionals() {
  try {
    const professionalsFolder = await findProfessionalsFolder();
    
    if (!professionalsFolder) {
      console.log('Professionals folder not found');
      return [];
    }

    const response = await drive.files.list({
      key: API_KEY,
      q: `'${professionalsFolder.id}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'files(id, name)',
    });

    const professionalsDoc = response.data.files?.find(f => 
      f.name.includes('בעלי מקצוע') || f.name.includes('מקצוע')
    );

    if (!professionalsDoc) {
      console.log('Professionals document not found');
      return [];
    }

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

    console.log(`Found ${professionals.length} professionals`);
    return professionals;
  } catch (error) {
    console.error('Error fetching professionals:', error.message);
    return [];
  }
}

export function getCitiesFromProfessionals(professionals) {
  return [...new Set(professionals.map(p => p.city).filter(Boolean))].sort();
}

export function getProfessionsFromProfessionals(professionals) {
  return [...new Set(professionals.map(p => p.profession).filter(Boolean))].sort();
}
