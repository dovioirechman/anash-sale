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

export function TopicFilter({ topics, selected, onSelect, adsTopic }) {
  return (
    <div className="topic-filter">
      {/* First tab: Ads */}
      <button 
        className={selected === adsTopic ? 'active' : ''} 
        onClick={() => onSelect(adsTopic)}
      >
        🎯 פרסומות
      </button>
      {/* Second tab: All articles */}
      <button 
        className={!selected || selected === null ? 'active' : ''} 
        onClick={() => onSelect(null)}
      >
        ✨ הכל
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
