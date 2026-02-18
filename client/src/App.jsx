import { useState } from 'react';
import { useArticles, isApartmentCategory } from './hooks/useArticles';
import { fetchArticle, fetchArticles } from './api/articles';
import { TopicFilter } from './components/TopicFilter';
import { CityFilter } from './components/CityFilter';
import { ArticleCard } from './components/ArticleCard';
import { ArticleView } from './components/ArticleView';
import { PublishForm } from './components/PublishForm';
import { AdBanner, SidebarAds, useBannerAds } from './components/AdBanner';
import { AdsPage } from './components/AdsPage';
import { WhatsAppGroups } from './components/WhatsAppGroups';
import { HomePage } from './components/HomePage';
import './styles.css';

// Categories to exclude from publishing (external sources)
const EXCLUDED_CATEGORIES = ['חדשות חב״ד', 'חדשות כלכלה', 'נדל״ן בלוד', 'קבוצות וואטסאפ'];

// Special topics
const ADS_TOPIC = '__פרסומות__';
const HOME_TOPIC = '__ראשי__';

const SEARCH_TOPIC = '__חיפוש__';

export default function App() {
  const [selectedTopic, setSelectedTopic] = useState(HOME_TOPIC); // Default to home page
  const [previousTopic, setPreviousTopic] = useState(HOME_TOPIC); // Track previous topic for search cancel
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
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
      const allArticles = await fetchArticles(); // Fetch all articles
      
      // Split query into words for flexible search
      const queryWords = searchQuery.trim().toLowerCase().split(/\s+/).filter(w => w.length > 1);
      
      const filtered = allArticles.filter(article => {
        const searchText = `${article.title || ''} ${article.summary || ''} ${article.content || ''}`.toLowerCase();
        // Article matches if ALL words are found (anywhere in the text)
        return queryWords.every(word => searchText.includes(word));
      });
      
      setSearchResults(filtered);
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

  return (
    <div className="app">
      {showPublishForm && (
        <PublishForm 
          categories={topics.filter(t => !EXCLUDED_CATEGORIES.includes(t))} 
          onClose={() => setShowPublishForm(false)} 
        />
      )}
      <div className="header-top-sticky">
        <div className="header-content">
          <div className="brand" onClick={() => setSelectedTopic(HOME_TOPIC)} style={{ cursor: 'pointer' }}>
            <img src="/logo.png" alt="אנש סייל" className="logo" />
          </div>

          <div className="header-buttons">
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
            <h1>הלוח <span className="hero-highlight">הווירטואלי</span> של <span className="hero-anash">אנ״ש</span></h1>
            <div className="hero-search">
              <input 
                type="text" 
                placeholder="חפש מודעות" 
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
              <button className="search-btn" onClick={handleSearch}><span className="material-icons-outlined">search</span></button>
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
          ) : loading ? (
            <div className="loading"></div>
          ) : articles.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
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
