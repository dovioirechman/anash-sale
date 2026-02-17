import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { ArticleCard } from './ArticleCard';
import { WhatsAppGroups } from './WhatsAppGroups';

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
  const [bannerAds, setBannerAds] = useState([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch banner ads from מודעות folder
        try {
          const adsRes = await fetch(`${API_URL}/ads`);
          const ads = await adsRes.json();
          setBannerAds(ads || []);
        } catch (e) {
          console.log('No banner ads found');
        }
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

          {/* Insert banner ad after every 2 sections */}
          {bannerAds.length > 0 && (index + 1) % 2 === 0 && index < sections.length - 1 && (() => {
            const ad = bannerAds[Math.floor(index / 2) % bannerAds.length];
            if (!ad || !ad.imageUrl) return null;
            return (
              <div className="home-banner-ad">
                <a 
                  href={ad.targetUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img 
                    src={ad.imageUrl}
                    alt={ad.description || 'פרסומת'}
                  />
                </a>
              </div>
            );
          })()}
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
