import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUBMISSIONS_FILE = path.join(__dirname, '../../data/submissions.json');

// Ensure data directory exists
const dataDir = path.dirname(SUBMISSIONS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load submissions from file
function loadSubmissions() {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading submissions:', error);
  }
  return [];
}

// Save submissions to file
function saveSubmissions(submissions) {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving submissions:', error);
  }
}

// Get all pending submissions
export function getAllSubmissions() {
  return loadSubmissions();
}

// Add a new submission
export function addSubmission(submission) {
  const submissions = loadSubmissions();
  const newSubmission = {
    id: Date.now().toString(),
    ...submission,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  submissions.push(newSubmission);
  saveSubmissions(submissions);
  return newSubmission;
}

// Get submission by ID
export function getSubmissionById(id) {
  const submissions = loadSubmissions();
  return submissions.find(s => s.id === id);
}

// Update submission status
export function updateSubmissionStatus(id, status) {
  const submissions = loadSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    submissions[index].status = status;
    submissions[index].updatedAt = new Date().toISOString();
    saveSubmissions(submissions);
    return submissions[index];
  }
  return null;
}

// Delete submission
export function deleteSubmission(id) {
  const submissions = loadSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    const deleted = submissions.splice(index, 1)[0];
    saveSubmissions(submissions);
    return deleted;
  }
  return null;
}
