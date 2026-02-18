export function CityFilter({ cities, selected, onSelect }) {
  if (!cities || cities.length === 0) {
    return null;
  }

  return (
    <div className="city-filter">
      <span className="city-filter-label"><span className="material-icons-outlined">location_on</span> סנן לפי עיר:</span>
      <div className="city-buttons">
        <button 
          className={!selected ? 'active' : ''} 
          onClick={() => onSelect(null)}
        >
          כל הערים
        </button>
        {cities.map((city) => (
          <button
            key={city}
            className={selected === city ? 'active' : ''}
            onClick={() => onSelect(city)}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}

