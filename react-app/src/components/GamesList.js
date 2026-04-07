import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'vernball_games';
const SPORTS = ['Basketball', 'Football', 'Soccer', 'Baseball'];

function loadGames() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error parsing games from localStorage', e);
    return [];
  }
}

function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const GamesList = () => {
  const [games, setGames] = useState([]);
  const [formData, setFormData] = useState({
    gameName: '',
    sport: SPORTS[0],
    dateTime: '',
    location: ''
  });
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [message, setMessage] = useState(null);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    setGames(loadGames());
  }, []);

  const showAlert = (text, type = 'danger') => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), 5000);
  };

  const filteredGames = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return games;

    return games.filter(game => {
      if (searchType === 'all') {
        return (
          game.gameName.toLowerCase().includes(query) ||
          game.sport.toLowerCase().includes(query) ||
          (game.signups || []).some(signup => signup.name.toLowerCase().includes(query))
        );
      }
      if (searchType === 'name') {
        return game.gameName.toLowerCase().includes(query);
      }
      if (searchType === 'sport') {
        return game.sport.toLowerCase().includes(query);
      }
      if (searchType === 'player') {
        return (game.signups || []).some(signup => signup.name.toLowerCase().includes(query));
      }
      return true;
    });
  }, [games, searchText, searchType]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addGame = (event) => {
    event.preventDefault();
    const { gameName, sport, dateTime, location } = formData;
    if (!gameName.trim() || !sport || !dateTime || !location.trim()) {
      showAlert('Please fill all fields.', 'warning');
      return;
    }

    // Log the form data as JSON
    console.log('Game Form Submission:', JSON.stringify({ gameName, sport, dateTime, location }, null, 2));

    // Perform AJAX fetch call
    fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameName, sport, dateTime, location })
    })
      .then(response => response.json())
      .then(data => {
        console.log('Mock API Response:', JSON.stringify(data, null, 2));
        setResponse(JSON.stringify(data, null, 2));
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setResponse('Error: ' + error.message);
      });

    const newGame = {
      gameId: Date.now(),
      gameName: gameName.trim(),
      sport,
      dateTime,
      location: location.trim(),
      playerCount: 0,
      signups: []
    };

    const updatedGames = [...games, newGame];
    saveGames(updatedGames);
    setGames(updatedGames);
    setFormData({ gameName: '', sport: SPORTS[0], dateTime: '', location: '' });
    showAlert('Game created successfully.', 'success');
  };

  const viewSignups = (game) => {
    if (!game.signups || game.signups.length === 0) {
      window.alert(`No one has signed up for ${game.gameName} yet.`);
      return;
    }

    const signupList = game.signups
      .map((signup, index) => `${index + 1}. ${signup.name}\n   Email: ${signup.email}`)
      .join('\n\n');

    window.alert(`Signups for ${game.gameName}:\n\n${signupList}`);
  };

  const signup = (gameId) => {
    const name = window.prompt('Enter your name:');
    if (!name || !name.trim()) return;
    const email = window.prompt('Enter your email:');
    if (!email || !email.trim()) return;

    const updatedGames = games.map(game => {
      if (game.gameId !== gameId) return game;
      const signups = [...(game.signups || []), { name: name.trim(), email: email.trim() }];
      return { ...game, signups, playerCount: signups.length };
    });

    setGames(updatedGames);
    saveGames(updatedGames);
    const game = updatedGames.find(g => g.gameId === gameId);
    if (game) showAlert(`Successfully joined ${game.gameName}!`, 'success');
  };

  const deleteGame = (gameId) => {
    if (!window.confirm('Delete this game?')) return;
    const updatedGames = games.filter(game => game.gameId !== gameId);
    setGames(updatedGames);
    saveGames(updatedGames);
    showAlert('Game deleted.', 'success');
  };

  return (
    <div className="container mt-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1>Vernball Games</h1>
          <p>Create games, browse events, and manage signups.</p>
        </div>
      </div>
      {message && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      <div className="row">
        <div className="col-lg-6">
          <div className="card mb-3">
            <div className="card-body">
              <h2>Add New Game</h2>
              <form id="gameForm" onSubmit={addGame}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="gameName">Game Name</label>
                  <input
                    className="form-control"
                    id="gameName"
                    value={formData.gameName}
                    onChange={(e) => handleChange('gameName', e.target.value)}
                    type="text"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="sport">Sport</label>
                  <select
                    className="form-select"
                    id="sport"
                    value={formData.sport}
                    onChange={(e) => handleChange('sport', e.target.value)}
                  >
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="dateTime">Date & Time</label>
                  <input
                    className="form-control"
                    id="dateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) => handleChange('dateTime', e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="location">Location</label>
                  <input
                    className="form-control"
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" type="submit">Create Game</button>
              </form>
              {response && <pre>{response}</pre>}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card mb-3">
            <div className="card-body">
              <h2>Registered Games</h2>
              <div className="mb-3">
                <label className="form-label" htmlFor="searchType">Search By:</label>
                <select
                  className="form-select"
                  id="searchType"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option value="all">All Fields</option>
                  <option value="name">Game Name</option>
                  <option value="sport">Sport</option>
                  <option value="player">Player Name</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="gameSearch">Search Games</label>
                <input
                  className="form-control"
                  id="gameSearch"
                  type="search"
                  placeholder="Enter game name, sport, or player name"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div id="gamesContainer">
                {filteredGames.length === 0 ? (
                  <div className="alert alert-info">No games found.</div>
                ) : filteredGames.map(game => (
                  <div key={game.gameId} className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{game.gameName}</h5>
                      <p className="card-text"><strong>Sport:</strong> {game.sport}</p>
                      <p className="card-text"><strong>Location:</strong> {game.location}</p>
                      <p className="card-text"><strong>Date & Time:</strong> {formatDateTime(game.dateTime)}</p>
                      <p className="card-text"><strong>Players signed up:</strong> {game.playerCount}</p>
                      <button className="btn btn-info btn-sm me-2" type="button" onClick={() => viewSignups(game)}>
                        View Signups
                      </button>
                      <button className="btn btn-success btn-sm me-2" type="button" onClick={() => signup(game.gameId)}>
                        Join
                      </button>
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => deleteGame(game.gameId)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamesList;
