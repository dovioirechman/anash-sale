import { Router } from 'express';
import { config } from '../config/index.js';
import { 
  getAllSubmissions, 
  addSubmission, 
  getSubmissionById,
  updateSubmissionStatus,
  deleteSubmission 
} from '../services/submissionsService.js';
import { appendToGoogleDoc } from '../services/googleDrive.js';

const router = Router();

// Simple token-based auth (in production, use proper JWT)
const activeSessions = new Set();

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Login
router.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (!config.admin.password) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }
  
  if (password === config.admin.password) {
    const token = generateToken();
    activeSessions.add(token);
    
    // Token expires after 24 hours
    setTimeout(() => activeSessions.delete(token), 24 * 60 * 60 * 1000);
    
    return res.json({ token });
  }
  
  return res.status(401).json({ error: 'Invalid password' });
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  activeSessions.delete(token);
  res.json({ message: 'Logged out' });
});

// Submit new ad (public endpoint)
router.post('/submit', (req, res) => {
  try {
    const { category, title, content, contact } = req.body;
    
    if (!category || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const submission = addSubmission({
      category,
      title,
      content,
      contact: contact || '',
    });
    
    res.json({ message: 'Submission received', id: submission.id });
  } catch (error) {
    console.error('Error adding submission:', error);
    res.status(500).json({ error: 'Failed to submit' });
  }
});

// Get all submissions (protected)
router.get('/submissions', requireAuth, (req, res) => {
  try {
    const submissions = getAllSubmissions();
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Approve submission (protected)
// Automatically adds to Google Drive if service account is configured
router.post('/submissions/:id/approve', requireAuth, async (req, res) => {
  try {
    const submission = getSubmissionById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Try to automatically add to Google Drive
    if (config.google.serviceAccount) {
      try {
        await appendToGoogleDoc(
          submission.category,
          submission.title,
          submission.content,
          submission.contact
        );
        
        // Delete submission after successful publish
        deleteSubmission(req.params.id);
        
        return res.json({ 
          message: 'המודעה אושרה ופורסמה בהצלחה!',
          published: true,
          category: submission.category
        });
      } catch (driveError) {
        console.error('Failed to publish to Drive:', driveError.message);
        // Fall back to manual copy
      }
    }
    
    // Fallback: Return formatted content for manual copy
    const formattedContent = `## ${submission.title}\n${submission.content}${submission.contact ? `\n\nליצירת קשר: ${submission.contact}` : ''}`;
    
    // Mark as approved and delete
    deleteSubmission(req.params.id);
    
    res.json({ 
      message: 'Submission approved',
      published: false,
      category: submission.category,
      formattedContent,
      instructions: `העתק את התוכן למסמך "${submission.category}" בגוגל דרייב`
    });
  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: 'Failed to approve submission' });
  }
});

// Reject/delete submission (protected)
router.delete('/submissions/:id', requireAuth, (req, res) => {
  try {
    const deleted = deleteSubmission(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json({ message: 'Submission deleted' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

export default router;
