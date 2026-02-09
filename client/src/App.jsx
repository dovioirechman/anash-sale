import { useState } from 'react';
import { useArticles, isApartmentCategory } from './hooks/useArticles';
import { fetchArticle } from './api/articles';
import { TopicFilter } from './components/TopicFilter';
import { CityFilter } from './components/CityFilter';
import { ArticleCard } from './components/ArticleCard';
import { ArticleView } from './components/ArticleView';
import { PublishForm } from './components/PublishForm';
import { AdBanner, SidebarAds } from './components/AdBanner';
import { AdsPage } from './components/AdsPage';
import { WhatsAppGroups } from './components/WhatsAppGroups';
import { HomePage } from './components/HomePage';
import './styles.css';

// Categories to exclude from publishing (external sources)
const EXCLUDED_CATEGORIES = ['חדשות חב״ד', 'חדשות כלכלה', 'נדל״ן בלוד', 'קבוצות וואטסאפ'];

// Special topics
const ADS_TOPIC = '__פרסומות__';
const HOME_TOPIC = '__ראשי__';

export default function App() {
  const [selectedTopic, setSelectedTopic] = useState(HOME_TOPIC); // Default to home page
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  
  // Only fetch articles if on a specific category
  const { articles, topics, cities, loading, error } = useArticles(
    (selectedTopic === ADS_TOPIC || selectedTopic === HOME_TOPIC) ? null : selectedTopic, 
    selectedCity
  );
  
  // Reset city filter when topic changes
  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setSelectedCity(null); // Reset city when topic changes
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
      <header className="main-header">
        <div className="header-content">
          <div className="brand" onClick={() => setSelectedTopic(HOME_TOPIC)} style={{ cursor: 'pointer' }}>
            <img src="/logo.png" alt="אנש סייל" className="logo" />
          </div>
          <div className="header-buttons">
            <button className="publish-btn" onClick={() => setShowPublishForm(true)}>
              ➕ פרסום מודעה
            </button>
            <a 
              href="https://wa.me/972552929803?text=שלום%2C%20אני%20מעוניין%20בפרסום%20עסקי%20באתר"
              target="_blank"
              rel="noopener noreferrer"
              className="business-btn"
            >
              📢 לפרסום עסקי
            </a>
          </div>
        </div>
      </header>

      <div className="main-layout">
        {/* Left Sidebar Ads */}
        <aside className="sidebar sidebar-left">
          <SidebarAds />
        </aside>

        <main className="container">
          <TopicFilter 
            topics={topics.filter(t => t !== 'קבוצות וואטסאפ')} 
            selected={selectedTopic} 
            onSelect={handleTopicSelect}
            adsTopic={ADS_TOPIC}
            homeTopic={HOME_TOPIC}
          />
          
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
            <div className="articles-grid">
              {articles.map((article) => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  onClick={handleArticleClick}
                />
              ))}
            </div>
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
