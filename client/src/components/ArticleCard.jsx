import { useState } from 'react';

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
}

const TOPIC_DEFAULTS = {
  'דירות למכירה': { icon: 'home', color: '#3B82F6', bg: '#EFF6FF' },
  'דירות להשכרה': { icon: 'apartment', color: '#6366F1', bg: '#EEF2FF' },
  'משרות': { icon: 'work', color: '#7B68A6', bg: '#F5F3FF' },
  'רכבים': { icon: 'directions_car', color: '#5D8AA8', bg: '#F0F9FF' },
  'ריהוט': { icon: 'chair', color: '#A67B5B', bg: '#FEF3C7' },
  'אלקטרוניקה': { icon: 'devices', color: '#708090', bg: '#F1F5F9' },
  'ביגוד': { icon: 'checkroom', color: '#C08081', bg: '#FDF2F8' },
  'ספרים': { icon: 'menu_book', color: '#8B7355', bg: '#FEF3C7' },
  'כללי': { icon: 'inventory_2', color: '#6B8E6B', bg: '#F0FDF4' },
  'חדשות חב״ד': { icon: 'article', color: '#7C3AED', bg: '#F5F3FF' },
  'חדשות כלכלה': { icon: 'trending_up', color: '#059669', bg: '#ECFDF5' },
  'נדל״ן בלוד': { icon: 'location_city', color: '#0891B2', bg: '#ECFEFF' },
  'נדל״ן': { icon: 'location_city', color: '#0891B2', bg: '#ECFEFF' },
  'קבוצות וואטסאפ': { icon: 'groups', color: '#25D366', bg: '#F0FDF4' },
  'בעלי מקצוע': { icon: 'engineering', color: '#D97706', bg: '#FFFBEB' },
};

function DefaultPlaceholder({ topic }) {
  const style = TOPIC_DEFAULTS[topic] || { icon: 'article', color: '#64748B', bg: '#F1F5F9' };
  return (
    <div className="article-default-image" style={{ backgroundColor: style.bg }}>
      <div className="article-default-icon" style={{ background: `linear-gradient(135deg, ${style.color} 0%, ${style.color}dd 100%)` }}>
        <span className="material-icons-outlined">{style.icon}</span>
      </div>
    </div>
  );
}

// Check if URL is a valid image (not a placeholder)
function isValidImageUrl(url) {
  if (!url) return false;
  // Treat placehold.co URLs as "no image" - use our icons instead
  if (url.includes('placehold.co')) return false;
  return true;
}

export function ArticleCard({ article, onClick }) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    onClick(article);
  };

  const hasValidImage = isValidImageUrl(article.imageUrl) && !imageError;

  return (
    <article className="article-card" onClick={handleClick}>
      <div className="article-image">
        {hasValidImage ? (
          <img 
            src={article.imageUrl} 
            alt={article.title}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <DefaultPlaceholder topic={article.topic} />
        )}
        {article.topic === 'חדשות חב״ד' && (
          <span className="news-badge chabad">חדשות חב״ד</span>
        )}
        {article.topic === 'חדשות כלכלה' && (
          <span className="news-badge economy">חדשות כלכלה</span>
        )}
        {article.topic === 'קבוצות וואטסאפ' && (
          <span className="news-badge whatsapp">קבוצת וואטסאפ</span>
        )}
        {article.city && (
          <span className="city-badge">📍 {article.city}</span>
        )}
      </div>
      <div className="article-content">
        <h2>{article.title}</h2>
        <p className="article-summary">{article.summary}</p>
        <time>{formatDate(article.date)}</time>
      </div>
    </article>
  );
}
