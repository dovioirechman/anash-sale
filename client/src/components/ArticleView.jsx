import { useState } from 'react';
import Markdown from 'react-markdown';

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
    <div className="article-hero-default" style={{ backgroundColor: style.bg }}>
      <div className="article-hero-icon" style={{ background: `linear-gradient(135deg, ${style.color} 0%, ${style.color}dd 100%)` }}>
        <span className="material-icons-outlined">{style.icon}</span>
      </div>
    </div>
  );
}

// Convert single line breaks to double (paragraphs) for proper spacing
function processContent(content) {
  if (!content) return '';
  return content.replace(/\n/g, '\n\n');
}

// Get first paragraph from content
function getFirstParagraph(content) {
  if (!content) return '';
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  return paragraphs[0] || '';
}

// Generate WhatsApp link
function getWhatsAppLink() {
  const phone = '972584077052'; // Israeli format without leading 0
  const message = encodeURIComponent('היי, אני מעוניין ליצור קשר בנוגע לאתר');
  return `https://wa.me/${phone}?text=${message}`;
}

// Check if URL is a valid image (not a placeholder)
function isValidImageUrl(url) {
  if (!url) return false;
  if (url.includes('placehold.co')) return false;
  return true;
}

export function ArticleView({ article, onBack }) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopy = async () => {
    const firstParagraph = getFirstParagraph(article.content);
    
    const textToCopy = `${article.title}

${firstParagraph}

--
לאתר אנ״ש סייל: https://anash-sale.vercel.app/`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const hasValidImage = isValidImageUrl(article.imageUrl) && !imageError;

  return (
    <div className="article-view">
      <div className="article-actions">
        <button className="back-btn" onClick={onBack}>
          <span className="material-icons-outlined">arrow_forward</span> חזרה
        </button>
        <button className="share-btn" onClick={handleCopy}>
          <span className="material-icons-outlined">{copied ? 'check' : 'share'}</span>
          {copied ? 'הועתק!' : 'שתף'}
        </button>
      </div>
      <article>
        <div className="article-hero-image">
          {hasValidImage ? (
            <img src={article.imageUrl} alt={article.title} onError={() => setImageError(true)} />
          ) : (
            <DefaultPlaceholder topic={article.topic} />
          )}
        </div>
        <div className="article-header">
          {article.isExternal && article.link && (
            <a 
              href={article.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="source-link"
            >
              <span className="material-icons-outlined">open_in_new</span>
              לכתבה המלאה במקור
              {article.summary?.includes('חב״ד און ליין') && ' (חב״ד און ליין)'}
              {article.summary?.includes('עדכוני חב"ד') && ' (עדכוני חב״ד)'}
              {article.topic === 'חדשות כלכלה' && ' (ביזנעס)'}
            </a>
          )}
          <h1>{article.title}</h1>
          <time>{formatDate(article.date)}</time>
        </div>
        <div className="content">
          <Markdown>{processContent(article.content)}</Markdown>
        </div>
      </article>
    </div>
  );
}
