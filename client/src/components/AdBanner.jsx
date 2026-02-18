import { useState, useEffect } from 'react';
import { API_URL } from '../config';

// Dismissable banner ads for homepage/category pages
export function DismissableBannerAds() {
  const [ads, setAds] = useState([]);
  const [visible, setVisible] = useState(() => {
    const saved = sessionStorage.getItem('banner-ads-visible');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    fetch(`${API_URL}/ads`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAds(data);
        }
      })
      .catch(err => console.error('Error fetching ads:', err));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('banner-ads-visible', 'false');
  };

  if (!visible || ads.length === 0) return null;

  return {
    TopBanner: ads[0]?.imageUrl ? (
      <div className="home-banner-ad">
        <button className="banner-close" onClick={handleDismiss} aria-label="סגור">✕</button>
        <a href={ads[0].targetUrl || '#'} target="_blank" rel="noopener noreferrer">
          <img src={ads[0].imageUrl} alt={ads[0].description || 'פרסומת'} />
        </a>
      </div>
    ) : null,
    MiddleBanner: ads[1]?.imageUrl ? (
      <div className="home-banner-ad">
        <button className="banner-close" onClick={handleDismiss} aria-label="סגור">✕</button>
        <a href={ads[1].targetUrl || '#'} target="_blank" rel="noopener noreferrer">
          <img src={ads[1].imageUrl} alt={ads[1].description || 'פרסומת'} />
        </a>
      </div>
    ) : null,
  };
}

// Helper to get hidden ads from sessionStorage
function getHiddenAds() {
  const saved = sessionStorage.getItem('hidden-banner-ads');
  return saved ? JSON.parse(saved) : [];
}

// Hook version for easier use - tracks each ad separately
export function useBannerAds() {
  const [ads, setAds] = useState([]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/ads`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAds(data);
        }
      })
      .catch(err => console.error('Error fetching ads:', err));
  }, []);

  const dismissAd = (index) => {
    const hidden = getHiddenAds();
    if (!hidden.includes(index)) {
      hidden.push(index);
      sessionStorage.setItem('hidden-banner-ads', JSON.stringify(hidden));
      forceUpdate(n => n + 1); // Trigger re-render
    }
  };

  const isAdVisible = (index) => !getHiddenAds().includes(index);

  return { ads, isAdVisible, dismissAd };
}

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

