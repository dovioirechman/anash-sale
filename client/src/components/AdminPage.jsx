import { useState, useEffect } from 'react';
import { API_URL } from '../config';

// Check if admin is logged in
export function isAdminLoggedIn() {
  return !!sessionStorage.getItem('adminToken');
}

export function AdminPage({ onClose }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [approvedContent, setApprovedContent] = useState(null);
  const [copied, setCopied] = useState(false);

  // Check for existing token
  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // Load submissions when logged in
  useEffect(() => {
    if (isLoggedIn && token) {
      loadSubmissions();
    }
  }, [isLoggedIn, token]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.filter(s => s.status === 'pending'));
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      setError('שגיאה בטעינת הבקשות');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        sessionStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
        setPassword('');
      } else {
        setError('סיסמה שגויה');
      }
    } catch (err) {
      setError('שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setToken('');
    setIsLoggedIn(false);
    setSubmissions([]);
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${API_URL}/admin/submissions/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // If automatically published, show success message
        if (data.published) {
          setError(''); // Clear any previous errors
          alert(`✓ ${data.message}\nקטגוריה: ${data.category}`);
        } else {
          // Fallback to manual copy
          setApprovedContent(data);
        }
        loadSubmissions();
      } else {
        setError('שגיאה באישור הבקשה');
      }
    } catch (err) {
      setError('שגיאה באישור הבקשה');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('האם למחוק את הבקשה?')) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/submissions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadSubmissions();
      } else {
        setError('שגיאה במחיקת הבקשה');
      }
    } catch (err) {
      setError('שגיאה במחיקת הבקשה');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-overlay" onClick={onClose}>
        <div className="admin-panel login-panel" onClick={e => e.stopPropagation()}>
          <div className="admin-header">
            <h2>כניסת מנהל</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <form onSubmit={handleLogin}>
            {error && <div className="form-error">{error}</div>}
            
            <div className="form-group">
              <label>סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="הזן סיסמת מנהל"
                autoFocus
              />
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Full page admin panel when logged in
  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-panel">
          <div className="admin-header">
            <h2>
              <span className="material-icons-outlined">admin_panel_settings</span>
              ניהול מודעות
            </h2>
            <div className="admin-actions">
              <button className="refresh-btn" onClick={loadSubmissions} title="רענן">
                <span className="material-icons-outlined">refresh</span>
              </button>
              <button className="logout-btn" onClick={handleLogout}>התנתק</button>
              <button className="back-btn" onClick={onClose}>
                <span className="material-icons-outlined">arrow_forward</span>
                חזרה לאתר
              </button>
            </div>
          </div>

          {error && <div className="form-error admin-error">{error}</div>}

          {approvedContent && (
            <div className="approved-modal">
              <div className="approved-content">
                <h3>מודעה אושרה!</h3>
                <p className="approved-instructions">{approvedContent.instructions}</p>
                <div className="approved-category">קטגוריה: {approvedContent.category}</div>
                <textarea
                  readOnly
                  value={approvedContent.formattedContent}
                  className="approved-text"
                />
                <div className="approved-actions">
                  <button 
                    className="copy-btn" 
                    onClick={() => copyToClipboard(approvedContent.formattedContent)}
                  >
                    {copied ? '✓ הועתק!' : 'העתק תוכן'}
                  </button>
                  <button 
                    className="close-approved-btn"
                    onClick={() => setApprovedContent(null)}
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="admin-content">
            {loading ? (
              <div className="admin-loading">
                <span className="material-icons-outlined spinning">sync</span>
                טוען...
              </div>
            ) : submissions.length === 0 ? (
              <div className="admin-empty">
                <span className="material-icons-outlined">inbox</span>
                <p>אין מודעות ממתינות לאישור</p>
              </div>
            ) : (
              <>
                <div className="submissions-count">
                  {submissions.length} מודעות ממתינות לאישור
                </div>
                <div className="submissions-list">
                  {submissions.map(submission => (
                    <div key={submission.id} className="submission-card">
                      <div className="submission-header">
                        <span className="submission-category">{submission.category}</span>
                        <span className="submission-date">
                          {new Date(submission.createdAt).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      <h3 className="submission-title">{submission.title}</h3>
                      <p className="submission-content">{submission.content}</p>
                      {submission.contact && (
                        <p className="submission-contact">
                          <span className="material-icons-outlined">contact_phone</span>
                          {submission.contact}
                        </p>
                      )}
                      <div className="submission-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => handleApprove(submission.id)}
                        >
                          <span className="material-icons-outlined">check_circle</span>
                          אשר ופרסם
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleDelete(submission.id)}
                        >
                          <span className="material-icons-outlined">delete</span>
                          מחק
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
