import { useState } from 'react';
import Markdown from 'react-markdown';

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
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

export function ArticleView({ article, onBack }) {
  const [copied, setCopied] = useState(false);

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
        {article.imageUrl && (
          <div className="article-hero-image">
            <img src={article.imageUrl} alt={article.title} />
          </div>
        )}
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
