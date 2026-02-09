// Map topics to icons
const TOPIC_ICONS = {
  'דירות': '🏠',
  'דירה': '🏠',
  'משרות': '💼',
  'משרה': '💼',
  'רכבים': '🚗',
  'רכב': '🚗',
  'ריהוט': '🪑',
  'אלקטרוניקה': '📱',
  'ביגוד': '👔',
  'ספרים': '📚',
  'כללי': '📦',
  'חדשות חב״ד': '📰',
  'חדשות כלכלה': '💰',
  'נדל״ן בלוד': '🏢',
  'קבוצות וואטסאפ': '💬',
};

export function getTopicIcon(topic) {
  return TOPIC_ICONS[topic] || '📋';
}

export function TopicFilter({ topics, selected, onSelect, adsTopic, homeTopic }) {
  return (
    <div className="topic-filter">
      {/* Home tab */}
      <button 
        className={selected === homeTopic ? 'active' : ''} 
        onClick={() => onSelect(homeTopic)}
      >
        🏠 ראשי
      </button>
      {/* Ads tab */}
      <button 
        className={selected === adsTopic ? 'active' : ''} 
        onClick={() => onSelect(adsTopic)}
      >
        🎯 פרסומות
      </button>
      {topics.map((topic) => (
        <button
          key={topic}
          className={selected === topic ? 'active' : ''}
          onClick={() => onSelect(topic)}
        >
          {getTopicIcon(topic)} {topic}
        </button>
      ))}
    </div>
  );
}
