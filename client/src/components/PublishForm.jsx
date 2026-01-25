import { useState } from 'react';

export function PublishForm({ categories, onClose }) {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!category || !title || !content) {
      setError('יש למלא את כל השדות המסומנים');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Use FormSubmit.co service (free, no signup required)
      const response = await fetch('https://formsubmit.co/ajax/dovi.lod@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `מודעה חדשה - ${category}: ${title}`,
          קטגוריה: category,
          כותרת: title,
          תוכן: content,
          'פרטי קשר': contact || 'לא צוין',
        })
      });

      if (response.ok) {
        setSent(true);
        setTimeout(onClose, 2000);
      } else {
        throw new Error('שגיאה בשליחה');
      }
    } catch (err) {
      setError('שגיאה בשליחה. נסה שוב או שלח ישירות למייל dovi.lod@gmail.com');
      console.error('Submit error:', err);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="publish-overlay">
        <div className="publish-form">
          <div className="success-message">
            <span className="success-icon">✓</span>
            <h3>המודעה נשלחה!</h3>
            <p>אנחנו נבדוק ונפרסם בהקדם</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="publish-overlay" onClick={onClose}>
      <div className="publish-form" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>פרסום מודעה חדשה</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-group">
            <label>קטגוריה *</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">בחר קטגוריה...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>כותרת *</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת המודעה"
              required
            />
          </div>

          <div className="form-group">
            <label>תוכן המודעה *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="פרט את המודעה..."
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label>פרטי קשר</label>
            <input 
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="טלפון / אימייל"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={sending}>
            {sending ? 'שולח...' : '📧 שלח לפרסום'}
          </button>
        </form>
      </div>
    </div>
  );
}
