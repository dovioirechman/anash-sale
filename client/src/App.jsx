import { useState, useEffect, useRef } from 'react';
import { useArticles, isApartmentCategory } from './hooks/useArticles';
import { fetchArticle, fetchArticles } from './api/articles';
import { fetchProfessionals } from './api/professionals';
import { TopicFilter } from './components/TopicFilter';
import { CityFilter } from './components/CityFilter';
import { ArticleCard } from './components/ArticleCard';
import { ArticleView } from './components/ArticleView';
import { PublishForm } from './components/PublishForm';
import { AdminPage, isAdminLoggedIn } from './components/AdminPage';
import { AdBanner, SidebarAds, useBannerAds } from './components/AdBanner';
import { AdsPage } from './components/AdsPage';
import { WhatsAppGroups } from './components/WhatsAppGroups';
import { HomePage } from './components/HomePage';
import { Professionals } from './components/Professionals';
import './styles.css';

// Categories to exclude from publishing (external sources)
const EXCLUDED_CATEGORIES = ['חדשות חב״ד', 'חדשות כלכלה', 'נדל״ן בלוד', 'קבוצות וואטסאפ'];

// Category icons for page headers
const CATEGORY_ICONS = {
  'דירות למכירה': { icon: 'home', color: '#3B82F6' },
  'דירות להשכרה': { icon: 'apartment', color: '#6366F1' },
  'משרות': { icon: 'work', color: '#7B68A6' },
  'רכבים': { icon: 'directions_car', color: '#5D8AA8' },
  'ריהוט': { icon: 'chair', color: '#A67B5B' },
  'אלקטרוניקה': { icon: 'devices', color: '#708090' },
  'ביגוד': { icon: 'checkroom', color: '#C08081' },
  'ספרים': { icon: 'menu_book', color: '#8B7355' },
  'כללי': { icon: 'inventory_2', color: '#6B8E6B' },
  'חדשות חב״ד': { icon: 'article', color: '#7C3AED' },
  'חדשות כלכלה': { icon: 'trending_up', color: '#059669' },
  'נדל״ן בלוד': { icon: 'location_city', color: '#0891B2' },
  'קבוצות וואטסאפ': { icon: 'groups', color: '#25D366' },
  'בעלי מקצוע': { icon: 'engineering', color: '#D97706' },
};

// Special topics
const ADS_TOPIC = '__פרסומות__';
const HOME_TOPIC = '__ראשי__';
const PROFESSIONALS_TOPIC = 'בעלי מקצוע';

const SEARCH_TOPIC = '__חיפוש__';

export default function App() {
  const [selectedTopic, setSelectedTopic] = useState(HOME_TOPIC); // Default to home page
  const [previousTopic, setPreviousTopic] = useState(HOME_TOPIC); // Track previous topic for search cancel
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const headerRef = useRef(null);
  
  // Set header height CSS variable for sticky categories
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);
  
  // Check for admin access via URL hash
  useEffect(() => {
    const checkAdminAccess = () => {
      if (window.location.hash === '#admin') {
        setShowAdminPage(true);
        // Remove hash from URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    checkAdminAccess();
    window.addEventListener('hashchange', checkAdminAccess);
    return () => window.removeEventListener('hashchange', checkAdminAccess);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  
  // Banner ads state (shared across all pages)
  const { ads: bannerAds, isAdVisible, dismissAd } = useBannerAds();
  
  // Only fetch articles if on a specific category
  const { articles, topics, cities, loading, error } = useArticles(
    (selectedTopic === ADS_TOPIC || selectedTopic === HOME_TOPIC) ? null : selectedTopic, 
    selectedCity
  );
  
  // Reset city filter when topic changes
  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setSelectedCity(null); // Reset city when topic changes
    setSearchQuery(''); // Clear search when changing topic
  };

  // Search match - checks if query word appears in text
  const searchMatch = (query, text) => {
    if (!query || !text || query.length < 2) return 0;
    query = query.toLowerCase();
    text = text.toLowerCase();
    
    // Exact word match or contains - highest score
    if (text.includes(query)) return 3;
    
    // Word starts with query (minimum 3 chars to avoid too many matches)
    if (query.length >= 3) {
      const words = text.split(/\s+/);
      if (words.some(w => w.startsWith(query))) return 2;
    }
    
    return 0;
  };

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Save current topic before searching
    if (selectedTopic !== SEARCH_TOPIC) {
      setPreviousTopic(selectedTopic);
    }
    
    setIsSearching(true);
    setSelectedTopic(SEARCH_TOPIC);
    
    try {
      // Fetch both articles and professionals
      const [allArticles, allProfessionals] = await Promise.all([
        fetchArticles(),
        fetchProfessionals()
      ]);
      
      // Split query into words for search (minimum 2 chars per word)
      const queryWords = searchQuery.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 2);
      
      if (queryWords.length === 0) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      // Search articles - require ALL words to match
      const scoredArticles = allArticles.map(article => {
        const searchText = `${article.title || ''} ${article.summary || ''} ${article.content || ''}`;
        const scores = queryWords.map(word => searchMatch(word, searchText));
        // All words must match (score > 0)
        if (scores.some(s => s === 0)) return { item: article, score: 0 };
        const score = scores.reduce((a, b) => a + b, 0);
        return { item: article, score };
      }).filter(x => x.score >= queryWords.length * 2); // Minimum threshold
      
      // Search professionals - require ALL words to match
      const scoredProfessionals = allProfessionals.map(pro => {
        const searchText = `${pro.name || ''} ${pro.profession || ''} ${pro.city || ''}`;
        const scores = queryWords.map(word => searchMatch(word, searchText));
        if (scores.some(s => s === 0)) return { item: null, score: 0 };
        const score = scores.reduce((a, b) => a + b, 0);
        return {
          item: {
            id: `pro-${pro.id}`,
            title: pro.name,
            summary: `${pro.profession || ''} ${pro.city ? '| ' + pro.city : ''}`,
            content: `${pro.name}\n${pro.profession || ''}\n${pro.city || ''}\n${pro.phone || ''}`,
            topic: 'בעלי מקצוע',
            imageUrl: pro.imageUrl,
            date: new Date().toISOString(),
            isProfessional: true,
            phone: pro.phone
          },
          score
        };
      }).filter(x => x.score >= queryWords.length * 2 && x.item);
      
      // Combine and sort by score (best matches first)
      const combined = [...scoredArticles, ...scoredProfessionals]
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
      
      setSearchResults(combined);
    } catch (e) {
      console.error('Search error:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If search is cleared and we're in search mode, go back to previous topic
    if (!value.trim() && selectedTopic === SEARCH_TOPIC) {
      setSelectedTopic(previousTopic);
      setSearchResults([]);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleArticleClick = async (article) => {
    setArticleLoading(true);
    try {
      const fullArticle = await fetchArticle(article.id);
      setSelectedArticle(fullArticle);
    } catch (e) {
      console.error('Error fetching article:', e);
    } finally {
      setArticleLoading(false);
    }
  };

  if (error) return <div className="error">שגיאה: {error}</div>;

  if (articleLoading) {
    return (
      <div className="container">
        <div className="loading">טוען מודעה...</div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="container">
        <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} />
      </div>
    );
  }

  // If admin page is shown and logged in, render only admin page
  if (showAdminPage && isAdminLoggedIn()) {
    return <AdminPage onClose={() => setShowAdminPage(false)} />;
  }

  return (
    <div className="app">
      {showPublishForm && (
        <PublishForm 
          categories={topics.filter(t => !EXCLUDED_CATEGORIES.includes(t))} 
          onClose={() => setShowPublishForm(false)} 
        />
      )}
      
      {showAdminPage && (
        <AdminPage onClose={() => setShowAdminPage(false)} />
      )}
      <div className="header-top-sticky" ref={headerRef}>
        <div className="header-content">
          <div className="brand" onClick={() => setSelectedTopic(HOME_TOPIC)} style={{ cursor: 'pointer' }}>
            <img src="/logo.png" alt="אנ״ש סייל" className="logo" />
          </div>

          <div className="header-buttons">
            {isAdminLoggedIn() && (
              <button className="admin-btn" onClick={() => setShowAdminPage(true)}>
                <span className="material-icons-outlined">admin_panel_settings</span> ניהול
              </button>
            )}
            <button className="publish-btn" onClick={() => setShowPublishForm(true)}>
              <span className="material-icons-outlined">add_circle_outline</span> פרסם מודעה
            </button>
            <a 
              href="https://wa.me/972552929803?text=שלום%2C%20אני%20מעוניין%20בפרסום%20עסקי%20באתר"
              target="_blank"
              rel="noopener noreferrer"
              className="business-btn"
            >
              <span className="material-icons-outlined">storefront</span> לפרסום עסקי
            </a>
          </div>
        </div>
      </div>
      
      <div className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content">
            <h1>הלוח <span className="hero-highlight">הווירטואלי</span> של <span className="hero-anash">אנ"ש</span></h1>
            <div className={`hero-search ${isSearchOpen ? 'expanded' : ''}`}>
              {isSearchOpen ? (
                <>
                  <input 
                    type="text" 
                    placeholder="חפש מודעות..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    ref={searchInputRef}
                    autoFocus
                    onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                  />
                  <button className="search-btn" onClick={handleSearch}>
                    <span className="material-icons-outlined">search</span>
                  </button>
                </>
              ) : (
                <button className="search-btn-collapsed" onClick={() => { setIsSearchOpen(true); }}>
                  <span className="material-icons-outlined">search</span>
                  <span>חיפוש</span>
                </button>
              )}
            </div>
        </div>
      </div>
      
      <div className="categories-sticky">
        <TopicFilter 
          topics={topics.filter(t => t !== 'קבוצות וואטסאפ')} 
          selected={selectedTopic} 
          onSelect={handleTopicSelect}
          adsTopic={ADS_TOPIC}
          homeTopic={HOME_TOPIC}
        />
      </div>

      <div className="main-layout">
        {/* Left Sidebar Ads */}
        <aside className="sidebar sidebar-left">
          <SidebarAds />
        </aside>

        <main className="container">
          {selectedTopic !== HOME_TOPIC && <WhatsAppGroups />}
          
          {selectedTopic && selectedTopic !== ADS_TOPIC && selectedTopic !== HOME_TOPIC && isApartmentCategory(selectedTopic) && cities.length > 0 && (
            <CityFilter 
              cities={cities} 
              selected={selectedCity} 
              onSelect={setSelectedCity} 
            />
          )}

          {selectedTopic === HOME_TOPIC ? (
            <HomePage 
              onArticleClick={handleArticleClick}
              onCategoryClick={handleTopicSelect}
            />
          ) : selectedTopic === SEARCH_TOPIC ? (
            isSearching ? (
              <div className="loading"></div>
            ) : searchResults.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <p>לא נמצאו תוצאות עבור "{searchQuery}"</p>
              </div>
            ) : (
              <>
                <div className="search-results-header">
                  <h2>תוצאות חיפוש: "{searchQuery}" ({searchResults.length} תוצאות)</h2>
                </div>
                <div className="articles-grid">
                  {searchResults.map((article) => (
                    <ArticleCard 
                      key={article.id} 
                      article={article} 
                      onClick={handleArticleClick}
                    />
                  ))}
                </div>
              </>
            )
          ) : selectedTopic === ADS_TOPIC ? (
            <AdsPage />
          ) : selectedTopic === PROFESSIONALS_TOPIC ? (
            <Professionals />
          ) : loading ? (
            <div className="loading"></div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                {CATEGORY_ICONS[selectedTopic] ? (
                  <span className="material-icons-outlined" style={{ fontSize: '3rem', color: CATEGORY_ICONS[selectedTopic].color }}>
                    {CATEGORY_ICONS[selectedTopic].icon}
                  </span>
                ) : '📋'}
              </span>
              <p>אין מודעות להצגה</p>
            </div>
          ) : (
            <>
              {/* Top Banner Ad */}
              {isAdVisible(0) && bannerAds.length > 0 && bannerAds[0]?.imageUrl && (
                <div className="home-banner-ad">
                  <button className="banner-close" onClick={() => dismissAd(0)} aria-label="סגור">✕</button>
                  <a href={bannerAds[0].targetUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <img src={bannerAds[0].imageUrl} alt={bannerAds[0].description || 'פרסומת'} />
                  </a>
                </div>
              )}
              
              <div className="articles-grid">
                {articles.slice(0, 8).map((article) => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    onClick={handleArticleClick}
                  />
                ))}
              </div>
              
              {/* Middle Banner Ad */}
              {isAdVisible(1) && bannerAds.length > 1 && bannerAds[1]?.imageUrl && articles.length > 8 && (
                <div className="home-banner-ad">
                  <button className="banner-close" onClick={() => dismissAd(1)} aria-label="סגור">✕</button>
                  <a href={bannerAds[1].targetUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <img src={bannerAds[1].imageUrl} alt={bannerAds[1].description || 'פרסומת'} />
                  </a>
                </div>
              )}
              
              {articles.length > 8 && (
                <div className="articles-grid">
                  {articles.slice(8).map((article) => (
                    <ArticleCard 
                      key={article.id} 
                      article={article} 
                      onClick={handleArticleClick}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Sidebar Ads */}
        <aside className="sidebar sidebar-right">
          <SidebarAds />
        </aside>
      </div>
    </div>
  );
}
