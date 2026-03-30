import { useEffect, useMemo, useState } from 'react';
import './App.css';

export default function App() {
  const [breweries, setBreweries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    const fetchBreweries = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.openbrewerydb.org/v1/breweries?per_page=50');

        if (!response.ok) {
          throw new Error('Failed to fetch brewery data.');
        }

        const data = await response.json();
        setBreweries(data);
      } catch (err) {
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchBreweries();
  }, []);

  const breweryTypes = useMemo(() => {
    const uniqueTypes = [
      ...new Set(breweries.map((brewery) => brewery.brewery_type).filter(Boolean)),
    ];
    return uniqueTypes.sort();
  }, [breweries]);

  const states = useMemo(() => {
    const uniqueStates = [...new Set(breweries.map((brewery) => brewery.state).filter(Boolean))];
    return uniqueStates.sort();
  }, [breweries]);

  const breweriesWithScore = useMemo(() => {
    return breweries.map((brewery) => ({
      ...brewery,
      cityLengthScore: (brewery.city || '').length,
    }));
  }, [breweries]);

  const filteredBreweries = useMemo(() => {
    return breweriesWithScore.filter((brewery) => {
      const matchesSearch =
        brewery.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brewery.city?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || brewery.brewery_type === typeFilter;
      const matchesState = stateFilter === 'all' || brewery.state === stateFilter;
      const matchesScore = brewery.cityLengthScore >= minScore;

      return matchesSearch && matchesType && matchesState && matchesScore;
    });
  }, [breweriesWithScore, searchTerm, typeFilter, stateFilter, minScore]);

  const totalBreweries = filteredBreweries.length;

  const averageCityNameLength = totalBreweries
    ? (
        filteredBreweries.reduce((sum, brewery) => sum + brewery.cityLengthScore, 0) /
        totalBreweries
      ).toFixed(1)
    : 0;

  const uniqueStatesCount = new Set(filteredBreweries.map((brewery) => brewery.state)).size;

  const mostCommonType = (() => {
    if (!filteredBreweries.length) return 'N/A';

    const counts = {};
    filteredBreweries.forEach((brewery) => {
      const type = brewery.brewery_type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  })();

  return (
    <div className="app">
      <header className="hero">
        <h1>Brewery Explorer Dashboard</h1>
        <p>
          Explore brewery data from across the U.S. Search, filter, and spot patterns at a glance.
        </p>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <h2>{totalBreweries}</h2>
          <p>Visible Breweries</p>
        </div>
        <div className="stat-card">
          <h2>{uniqueStatesCount}</h2>
          <p>States Represented</p>
        </div>
        <div className="stat-card">
          <h2>{averageCityNameLength}</h2>
          <p>Avg. City Name Length</p>
        </div>
        <div className="stat-card">
          <h2>{mostCommonType}</h2>
          <p>Most Common Type</p>
        </div>
      </section>

      <section className="controls">
        <input
          type="text"
          placeholder="Search by brewery or city"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {breweryTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="all">All States</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        <div className="slider-box">
          <label htmlFor="scoreRange">Min City Length: {minScore}</label>
          <input
            id="scoreRange"
            type="range"
            min="0"
            max="20"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
          />
        </div>
      </section>

      <section className="table-section">
        <h3>Brewery List</h3>

        {loading && <p>Loading breweries...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Country</th>
                  <th>City Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredBreweries.slice(0, 50).map((brewery) => (
                  <tr key={brewery.id}>
                    <td>{brewery.name}</td>
                    <td>{brewery.brewery_type}</td>
                    <td>{brewery.city}</td>
                    <td>{brewery.state}</td>
                    <td>{brewery.country}</td>
                    <td>{brewery.cityLengthScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredBreweries.length && <p>No breweries match your filters.</p>}
          </div>
        )}
      </section>
    </div>
  );
}