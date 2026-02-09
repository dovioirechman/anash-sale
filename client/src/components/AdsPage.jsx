import { useState, useEffect } from 'react';
import { API_URL } from '../config';

// Convert relative image URL to full URL
function getImageUrl(imageUrl) {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  const path = imageUrl.startsWith('/api') ? imageUrl.slice(4) : imageUrl;
  return `${API_URL}${path}`;
}

export function AdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/ads/page`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAds(data);
        }
      })
      .catch(err => console.error('Error fetching page ads:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">טוען מודעות...</div>
      </div>
    );
  }

  return (
    <div className="ads-page-content">
      <div className="ads-page-header">
        <h2>📢 לוח פרסומות</h2>
        <p>לחצו על מודעה למעבר לאתר המפרסם</p>
      </div>

      {ads.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>אין מודעות להצגה כרגע</p>
        </div>
      ) : (
        <div className="ads-gallery">
          {ads.map(ad => (
            <a 
              key={ad.id}
              href={ad.targetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ad-gallery-item"
            >
              <img 
                src={getImageUrl(ad.imageUrl)} 
                alt={ad.description || 'מודעה ממומנת'} 
                loading="lazy"
              />
              {ad.description && (
                <span className="ad-description">{ad.description}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

