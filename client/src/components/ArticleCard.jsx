function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
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
          src={article.imageUrl} 
          alt={article.title}
          loading="lazy"
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
