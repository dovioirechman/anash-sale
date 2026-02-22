import { useState, useEffect } from 'react';
import { fetchProfessionals, fetchCities, fetchProfessions } from '../api/professionals';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const DefaultAvatar = () => (
  <div className="professional-default-avatar">
    <span className="material-icons-outlined">engineering</span>
  </div>
);

// Check if URL is a valid image
function isValidImageUrl(url) {
  if (!url) return false;
  if (url.includes('placehold.co')) return false;
  return true;
}

function formatPhoneForWhatsApp(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1);
  }
  return cleaned;
}

// Global state for header visibility
let globalHeaderVisible = true;

export function Professionals() {
  const [professionals, setProfessionals] = useState([]);
  const [cities, setCities] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headerVisible, setHeaderVisible] = useState(globalHeaderVisible);

  const handleCloseHeader = () => {
    globalHeaderVisible = false;
    setHeaderVisible(false);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [pros, citiesData, professionsData] = await Promise.all([
          fetchProfessionals(),
          fetchCities(),
          fetchProfessions(),
        ]);
        setProfessionals(pros);
        setCities(citiesData);
        setProfessions(professionsData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function filterProfessionals() {
      try {
        const filtered = await fetchProfessionals(selectedCity, selectedProfession);
        setProfessionals(filtered);
      } catch (e) {
        console.error('Error filtering:', e);
      }
    }
    filterProfessionals();
  }, [selectedCity, selectedProfession]);

  if (loading) {
    return <div className="loading"></div>;
  }

  if (error) {
    return <div className="error">שגיאה: {error}</div>;
  }

  return (
    <div className="professionals-page">
      {headerVisible && (
        <div className="professionals-header">
          <button className="header-close-btn" onClick={handleCloseHeader} aria-label="סגור">✕</button>
          <h2>
            <span className="material-icons-outlined">engineering</span>
            בעלי מקצוע
          </h2>
          <p>מצאו את בעל המקצוע המתאים לכם</p>
          <a
            href="https://wa.me/972552929803?text=שלום%2C%20אני%20בעל%20מקצוע%20ומעוניין%20לפרסם%20את%20עצמי%20באתר%20אנ״ש%20סייל"
            target="_blank"
            rel="noopener noreferrer"
            className="advertise-pro-btn"
          >
            <WhatsAppIcon />
            אתה בעל מקצוע? פרסם את עצמך כאן
          </a>
        </div>
      )}

      <div className="professionals-filters">
        {cities.length > 0 && (
          <div className="filter-group">
            <label>
              <span className="material-icons-outlined">location_on</span>
              עיר
            </label>
            <div className="filter-buttons">
              <button 
                className={!selectedCity ? 'active' : ''} 
                onClick={() => setSelectedCity(null)}
              >
                הכל
              </button>
              {cities.map(city => (
                <button
                  key={city}
                  className={selectedCity === city ? 'active' : ''}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {professions.length > 0 && (
          <div className="filter-group">
            <label>
              <span className="material-icons-outlined">build</span>
              מקצוע
            </label>
            <div className="filter-buttons">
              <button 
                className={!selectedProfession ? 'active' : ''} 
                onClick={() => setSelectedProfession(null)}
              >
                הכל
              </button>
              {professions.map(prof => (
                <button
                  key={prof}
                  className={selectedProfession === prof ? 'active' : ''}
                  onClick={() => setSelectedProfession(prof)}
                >
                  {prof}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {professionals.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👷</span>
          <p>לא נמצאו בעלי מקצוע</p>
        </div>
      ) : (
        <div className="professionals-grid">
          {professionals.map(pro => (
            <div key={pro.id} className="professional-card">
              <div className="professional-image">
                {isValidImageUrl(pro.imageUrl) ? (
                  <img src={pro.imageUrl} alt={pro.name} loading="lazy" />
                ) : (
                  <DefaultAvatar />
                )}
              </div>
              <div className="professional-info">
                <h3>{pro.name}</h3>
                {pro.profession && (
                  <div className="professional-detail">
                    <span className="material-icons-outlined">build</span>
                    {pro.profession}
                  </div>
                )}
                {pro.city && (
                  <div className="professional-detail">
                    <span className="material-icons-outlined">location_on</span>
                    {pro.city}
                  </div>
                )}
                {pro.phone && (
                  <div className="professional-contact">
                    <span className="phone-number">
                      <span className="material-icons-outlined">phone</span>
                      {pro.phone}
                    </span>
                    <a
                      href={`https://wa.me/${formatPhoneForWhatsApp(pro.phone)}?text=${encodeURIComponent('שלום, הגעתי מאתר אנ״ש סייל')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <WhatsAppIcon />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
