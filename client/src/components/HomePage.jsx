import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { ArticleCard } from './ArticleCard';
import { WhatsAppGroups } from './WhatsAppGroups';
import { useBannerAds } from './AdBanner';
import { fetchProfessionals } from '../api/professionals';

// Category icons
const CATEGORY_ICONS = {
  'דירות למכירה': '🏠',
  'דירות להשכרה': '🔑',
  'רכבים': '🚗',
  'ריהוט': '🪑',
  'אלקטרוניקה': '📱',
  'ביגוד': '👔',
  'ספרים': '📚',
  'כללי': '📦',
  'חדשות חב״ד': '📰',
  'חדשות כלכלה': '💰',
  'משרות': '💼',
};

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function formatPhoneForWhatsApp(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[-\s]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1);
  }
  return cleaned;
}

export function HomePage({ onArticleClick, onCategoryClick }) {
  const [sections, setSections] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { ads: bannerAds, isAdVisible, dismissAd } = useBannerAds();

  useEffect(() => {
    async function fetchHomeData() {
      try {
        // Fetch articles and professionals in parallel
        const [articlesRes, prosData] = await Promise.all([
          fetch(`${API_URL}/articles`),
          fetchProfessionals().catch(() => []),
        ]);
        const allArticles = await articlesRes.json();
        
        // Set professionals (limit to 4 for home page)
        setProfessionals(prosData.slice(0, 4));
        
        // Group by topic and take latest 4 from each
        const grouped = {};
        const excludeTopics = ['קבוצות וואטסאפ'];
        
        allArticles.forEach(article => {
          if (excludeTopics.includes(article.topic)) return;
          if (!grouped[article.topic]) {
            grouped[article.topic] = [];
          }
          if (grouped[article.topic].length < 4) {
            grouped[article.topic].push(article);
          }
        });

        // Convert to array and sort by priority order
        const priorityOrder = ['חדשות כלכלה', 'משרות', 'דירות למכירה', 'דירות להשכרה'];
        const sectionsArray = Object.entries(grouped)
          .map(([topic, articles]) => ({ topic, articles }))
          .filter(s => s.articles.length > 0)
          .sort((a, b) => {
            const aIndex = priorityOrder.indexOf(a.topic);
            const bIndex = priorityOrder.indexOf(b.topic);
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return b.articles.length - a.articles.length;
          });

        setSections(sectionsArray);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeData();
  }, []);

  if (loading) {
    return <div className="loading"></div>;
  }

  return (
    <div className="home-page">
      {/* WhatsApp Groups */}
      <WhatsAppGroups />

      {/* Top Banner Ad */}
      {isAdVisible(0) && bannerAds.length > 0 && bannerAds[0]?.imageUrl && (
        <div className="home-banner-ad">
          <button className="banner-close" onClick={() => dismissAd(0)} aria-label="סגור">✕</button>
          <a 
            href={bannerAds[0].targetUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img 
              src={bannerAds[0].imageUrl}
              alt={bannerAds[0].description || 'פרסומת'}
            />
          </a>
        </div>
      )}

      {/* Category Sections */}
      {sections.map((section, index) => (
        <div key={section.topic}>
          <section className="home-category-section">
            <div className="category-header">
              <h2>
                <span className="category-icon">{CATEGORY_ICONS[section.topic] || '📋'}</span>
                {section.topic}
              </h2>
              <button 
                className="see-all-btn"
                onClick={() => onCategoryClick(section.topic)}
              >
                לכל המודעות ←
              </button>
            </div>
            <div className="home-articles-grid">
              {section.articles.map(article => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  onClick={onArticleClick}
                />
              ))}
            </div>
          </section>

          {/* Insert professionals after חדשות כלכלה (first section) */}
          {index === 0 && professionals.length > 0 && (
            <section className="home-category-section home-professionals-simple">
              <div className="category-header">
                <h2>
                  <span className="category-icon">🔧</span>
                  בעלי מקצוע
                </h2>
                <button 
                  className="see-all-btn"
                  onClick={() => onCategoryClick('בעלי מקצוע')}
                >
                  לכל בעלי המקצוע ←
                </button>
              </div>
              <div className="home-professionals-grid">
                {professionals.map(pro => (
                  <div key={pro.id} className="home-professional-card">
                    <div className="home-pro-avatar">
                      {pro.imageUrl ? (
                        <img src={pro.imageUrl} alt={pro.name} />
                      ) : (
                        <span className="material-icons-outlined">engineering</span>
                      )}
                    </div>
                    <div className="home-pro-info">
                      <h4>{pro.name}</h4>
                      {pro.profession && <span className="home-pro-profession">{pro.profession}</span>}
                      {pro.city && <span className="home-pro-city">📍 {pro.city}</span>}
                    </div>
                    {pro.phone && (
                      <a
                        href={`https://wa.me/${formatPhoneForWhatsApp(pro.phone)}?text=${encodeURIComponent('שלום, הגעתי מאתר אנ״ש סייל')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="home-pro-whatsapp"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <WhatsAppIcon />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Insert second banner ad after section 2 */}
          {isAdVisible(1) && bannerAds.length > 1 && index === 1 && bannerAds[1]?.imageUrl && (
            <div className="home-banner-ad">
              <button className="banner-close" onClick={() => dismissAd(1)} aria-label="סגור">✕</button>
              <a 
                href={bannerAds[1].targetUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img 
                  src={bannerAds[1].imageUrl}
                  alt={bannerAds[1].description || 'פרסומת'}
                />
              </a>
            </div>
          )}
        </div>
      ))}

      {/* Contact Section */}
      <section className="contact-section">
        <a 
          href="https://wa.me/972552929803?text=שלום%2C%20יש%20לי%20שאלה%20לגבי%20האתר"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-btn"
        >
          📱 יש שאלה? דברו איתנו
        </a>
      </section>
    </div>
  );
}
