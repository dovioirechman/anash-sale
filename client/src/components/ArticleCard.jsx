function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
}

// Professional placeholder images by topic
const DEFAULT_IMAGES = {
  'משרות': 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="jg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0066cc"/><stop offset="100%" stop-color="#004d99"/></linearGradient></defs><rect fill="url(#jg)" width="400" height="300"/><rect x="140" y="90" width="120" height="90" rx="6" fill="#fff" opacity="0.95"/><rect x="155" y="105" width="90" height="6" rx="3" fill="#0066cc"/><rect x="155" y="118" width="70" height="4" rx="2" fill="#ccc"/><rect x="155" y="128" width="80" height="4" rx="2" fill="#ccc"/><rect x="155" y="145" width="40" height="18" rx="4" fill="#0066cc"/><circle cx="200" cy="210" r="35" fill="#fff" opacity="0.2"/><path d="M185 205 h30 v-8 c0-8-6-14-15-14s-15 6-15 14v8z" fill="#fff" opacity="0.9"/><circle cx="200" cy="188" r="10" fill="#fff" opacity="0.9"/></svg>`),
  'דירות למכירה': 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00a86b"/><stop offset="100%" stop-color="#007a4d"/></linearGradient></defs><rect fill="url(#hg)" width="400" height="300"/><rect x="120" y="130" width="160" height="100" fill="#fff" opacity="0.95"/><polygon points="200,70 100,130 300,130" fill="#fff" opacity="0.95"/><rect x="175" y="170" width="50" height="60" fill="#00a86b"/><rect x="140" y="150" width="30" height="25" fill="#b3e6d3"/><rect x="230" y="150" width="30" height="25" fill="#b3e6d3"/><circle cx="200" cy="60" r="25" fill="#fff" opacity="0.2"/><text x="200" y="66" text-anchor="middle" fill="#007a4d" font-family="Arial" font-size="16" font-weight="bold">₪</text></svg>`),
  'דירות להשכרה': 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient></defs><rect fill="url(#rg)" width="400" height="300"/><rect x="100" y="100" width="200" height="130" fill="#fff" opacity="0.95"/><rect x="100" y="85" width="200" height="20" fill="#fff" opacity="0.95"/><rect x="130" y="120" width="45" height="35" fill="#c7d2fe"/><rect x="195" y="120" width="45" height="35" fill="#c7d2fe"/><rect x="260" y="120" width="30" height="35" fill="#c7d2fe"/><rect x="130" y="170" width="45" height="35" fill="#c7d2fe"/><rect x="175" y="170" width="50" height="60" fill="#6366f1"/><circle cx="320" cy="60" r="35" fill="#fff" opacity="0.2"/><text x="320" y="68" text-anchor="middle" fill="#4f46e5" font-family="Arial" font-size="14" font-weight="bold">להשכרה</text></svg>`),
  'רכבים': 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#374151"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect fill="url(#cg)" width="400" height="300"/><path d="M100 180 L120 140 L280 140 L300 180 L310 180 L315 190 L315 210 L85 210 L85 190 L90 180 Z" fill="#fff" opacity="0.95"/><rect x="130" y="148" width="55" height="28" rx="3" fill="#93c5fd"/><rect x="215" y="148" width="55" height="28" rx="3" fill="#93c5fd"/><circle cx="130" cy="210" r="22" fill="#374151"/><circle cx="130" cy="210" r="14" fill="#6b7280"/><circle cx="270" cy="210" r="22" fill="#374151"/><circle cx="270" cy="210" r="14" fill="#6b7280"/><rect x="88" y="185" width="16" height="8" rx="2" fill="#fbbf24"/><rect x="296" y="185" width="16" height="8" rx="2" fill="#ef4444"/></svg>`),
  'חדשות כלכלה': 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#047857"/></linearGradient></defs><rect fill="url(#eg)" width="400" height="300"/><rect x="100" y="80" width="200" height="140" rx="8" fill="#fff" opacity="0.95"/><polyline points="120,180 160,160 200,170 240,130 280,150" fill="none" stroke="#059669" stroke-width="4" stroke-linecap="round"/><circle cx="120" cy="180" r="5" fill="#059669"/><circle cx="160" cy="160" r="5" fill="#059669"/><circle cx="200" cy="170" r="5" fill="#059669"/><circle cx="240" cy="130" r="5" fill="#059669"/><circle cx="280" cy="150" r="5" fill="#059669"/><rect x="120" y="100" width="60" height="6" rx="3" fill="#059669"/><rect x="120" y="112" width="100" height="4" rx="2" fill="#d1d5db"/></svg>`),
  'default': 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6b7280"/><stop offset="100%" stop-color="#4b5563"/></linearGradient></defs><rect fill="url(#dg)" width="400" height="300"/><rect x="130" y="90" width="140" height="100" rx="8" fill="#fff" opacity="0.95"/><rect x="145" y="105" width="90" height="6" rx="3" fill="#9ca3af"/><rect x="145" y="118" width="110" height="4" rx="2" fill="#d1d5db"/><rect x="145" y="128" width="70" height="4" rx="2" fill="#d1d5db"/><rect x="145" y="155" width="30" height="20" rx="4" fill="#6b7280"/><rect x="180" y="155" width="30" height="20" rx="4" fill="#6b7280" opacity="0.5"/></svg>`)
};

function getDefaultImage(topic) {
  return DEFAULT_IMAGES[topic] || DEFAULT_IMAGES['default'];
}

export function ArticleCard({ article, onClick }) {
  const handleClick = () => {
    if (article.isExternal && article.link) {
      // Open external links in new tab
      window.open(article.link, '_blank', 'noopener,noreferrer');
    } else {
      onClick(article);
    }
  };

  return (
    <article className="article-card" onClick={handleClick}>
      <div className="article-image">
        <img 
          src={article.imageUrl || getDefaultImage(article.topic)} 
          alt={article.title}
          loading="lazy"
          onError={(e) => { e.target.src = getDefaultImage(article.topic); }}
        />
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
