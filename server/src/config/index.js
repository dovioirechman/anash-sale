import dotenv from 'dotenv';
dotenv.config();

// Parse service account credentials from environment variable
let serviceAccountCredentials = null;
if (process.env.GOOGLE_SERVICE_ACCOUNT) {
  try {
    serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT:', e.message);
  }
}

export const config = {
  port: process.env.PORT || 4000,
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    serviceAccount: serviceAccountCredentials,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '1hBWqhB0hVJvJH0o_7wQtuxoweXAIofJC',
  },
  admin: {
    password: process.env.ADMIN_PASSWORD,
  },
};
