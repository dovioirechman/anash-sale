import { useState, useEffect } from 'react';
import { API_URL } from '../config';

// WhatsApp logo SVG
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export function WhatsAppGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(() => {
    // Check localStorage for saved state
    const saved = localStorage.getItem('whatsapp-visible');
    return saved === null ? true : saved === 'true';
  });

  // Save visibility state to localStorage
  const handleClose = () => {
    setVisible(false);
    localStorage.setItem('whatsapp-visible', 'false');
  };

  const handleOpen = () => {
    setVisible(true);
    localStorage.setItem('whatsapp-visible', 'true');
  };

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch(`${API_URL}/articles?topic=קבוצות וואטסאפ`);
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error('Error fetching WhatsApp groups:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, []);

  if (loading || groups.length === 0) return null;

  // Show mini button when collapsed
  if (!visible) {
    return (
      <button className="whatsapp-mini-btn" onClick={handleOpen}>
        <span className="whatsapp-mini-icon"><WhatsAppIcon /></span>
        <span className="whatsapp-mini-text">קבוצות וואטסאפ</span>
      </button>
    );
  }

  const displayGroups = expanded ? groups : groups.slice(0, 4);

  return (
    <div className="whatsapp-section">
      <button className="whatsapp-close" onClick={handleClose} aria-label="סגור">
        ✕
      </button>
      <div className="whatsapp-header">
        <div className="whatsapp-title">
          <span className="whatsapp-icon"><WhatsAppIcon /></span>
          <h3>קבוצות וואטסאפ</h3>
        </div>
        <p>הצטרפו לקבוצות הקהילה שלנו</p>
      </div>
      
      <div className="whatsapp-grid">
        {displayGroups.map((group) => (
          <a 
            key={group.id}
            href={group.link}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-card"
          >
            <span className="whatsapp-card-icon"><WhatsAppIcon /></span>
            <span className="whatsapp-card-name">{group.title}</span>
            <span className="whatsapp-card-arrow">←</span>
          </a>
        ))}
      </div>
      
      {groups.length > 4 && (
        <button 
          className="whatsapp-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'הצג פחות' : `הצג עוד ${groups.length - 4} קבוצות`}
        </button>
      )}
    </div>
  );
}
