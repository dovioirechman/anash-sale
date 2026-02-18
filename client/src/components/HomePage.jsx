import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { ArticleCard } from './ArticleCard';
import { WhatsAppGroups } from './WhatsAppGroups';
import { useBannerAds } from './AdBanner';

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

export function HomePage({ onArticleClick, onCategoryClick }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { ads: bannerAds, isAdVisible, dismissAd } = useBannerAds();

  useEffect(() => {
    async function fetchHomeData() {
      try {
        // Fetch all articles
        const res = await fetch(`${API_URL}/articles`);
        const allArticles = await res.json();
        
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
