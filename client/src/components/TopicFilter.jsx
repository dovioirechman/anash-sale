// Map topics to Material Icons (using outlined style)
const TOPIC_ICONS = {
  'דירות למכירה': 'home',
  'דירות להשכרה': 'apartment',
  'דירות': 'home',
  'דירה': 'home',
  'משרות': 'work_outline',
  'משרה': 'work_outline',
  'רכבים': 'directions_car',
  'רכב': 'directions_car',
  'ריהוט': 'chair',
  'אלקטרוניקה': 'devices',
  'ביגוד': 'checkroom',
  'ספרים': 'menu_book',
  'כללי': 'category',
  'חדשות חב״ד': 'article',
  'חדשות כלכלה': 'trending_up',
  'נדל״ן בלוד': 'location_city',
  'קבוצות וואטסאפ': 'forum',
  'בעלי מקצוע': 'engineering',
};

export function getTopicIcon(topic) {
  return TOPIC_ICONS[topic] || 'label';
}

const PROFESSIONALS_TOPIC = 'בעלי מקצוע';

export function TopicFilter({ topics, selected, onSelect, adsTopic, homeTopic }) {
  return (
    <div className="topic-filter">
      {/* Home tab */}
      <button 
        className={selected === homeTopic ? 'active' : ''} 
        onClick={() => onSelect(homeTopic)}
      >
        <span className="material-icons-outlined">home</span> ראשי
      </button>
      {/* Professionals tab */}
      <button 
        className={selected === PROFESSIONALS_TOPIC ? 'active' : ''} 
        onClick={() => onSelect(PROFESSIONALS_TOPIC)}
      >
        <span className="material-icons-outlined">engineering</span> בעלי מקצוע
      </button>
      {/* Ads tab */}
      <button 
        className={selected === adsTopic ? 'active' : ''} 
        onClick={() => onSelect(adsTopic)}
      >
        <span className="material-icons-outlined">campaign</span> פרסומות
      </button>
      {topics.map((topic) => (
        <button
          key={topic}
          className={selected === topic ? 'active' : ''}
          onClick={() => onSelect(topic)}
        >
          <span className="material-icons-outlined">{getTopicIcon(topic)}</span> {topic}
        </button>
      ))}
    </div>
  );
}
