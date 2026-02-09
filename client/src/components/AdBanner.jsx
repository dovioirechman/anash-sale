import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export function AdBanner({ position = 'middle', className = '' }) {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/ads?position=${position}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAds(data);
        }
      })
      .catch(err => console.error('Error fetching ads:', err));
  }, [position]);

  // Rotate ads every 5 seconds if multiple
  useEffect(() => {
    if (ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ads.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[currentIndex];

  return (
    <div className={`ad-banner ad-${position} ${className}`}>
      <a 
        href={ad.targetUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="ad-link"
      >
        <img 
          src={ad.imageUrl} 
          alt={ad.description || 'פרסומת'} 
          loading="lazy"
        />
      </a>
      {ads.length > 1 && (
        <div className="ad-dots">
          {ads.map((_, idx) => (
            <span 
              key={idx} 
              className={`dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      )}
      <span className="ad-label">ממומן</span>
    </div>
  );
}

// Sidebar ads component
export function SidebarAds() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/ads?position=side`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAds(data);
        }
      })
      .catch(err => console.error('Error fetching sidebar ads:', err));
  }, []);

  if (ads.length === 0) return null;

  return (
    <div className="sidebar-ads">
      {ads.map(ad => (
        <a 
          key={ad.id}
          href={ad.targetUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="sidebar-ad"
        >
          <img 
            src={ad.imageUrl} 
            alt={ad.description || 'פרסומת'} 
            loading="lazy"
          />
          <span className="ad-label">ממומן</span>
        </a>
      ))}
    </div>
  );
}

