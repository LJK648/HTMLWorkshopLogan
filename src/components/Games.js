import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'vernball_games';

const Games = () => {
    const [games, setGames] = useState([]);
    const [gameName, setGameName] = useState('');
    const [sport, setSport] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [location, setLocation] = useState('');
    const [searchText, setSearchText] = useState('');
    const [searchType, setSearchType] = useState('all');

    // Load games from localStorage
    useEffect(() => {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
            try {
                const saved = JSON.parse(json);
                setGames(Array.isArray(saved) ? saved : []);
            } catch (error) {
                console.error('Error reading games from localStorage', error);
            }
        }
    }, []);

    const saveGames = (newGames) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newGames));
        setGames(newGames);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!gameName.trim() || !sport || !dateTime || !location.trim()) {
            alert('Please fill all fields.');
            return;
        }

        const newGame = {
            gameId: Date.now(),
            gameName: gameName.trim(),
            sport,
            dateTime,
            location: location.trim(),
            playerCount: 0,
            signups: []
        };

        const newGames = [...games, newGame];
        saveGames(newGames);

        setGameName('');
        setSport('');
        setDateTime('');
        setLocation('');
    };

    const formatDateTime = (value) => {
        if (!value) return 'N/A';
        try {
            const dt = new Date(value);
            return dt.toLocaleString();
        } catch {
            return value;
        }
    };

    const viewSignups = (gameId) => {
        const game = games.find(g => g.gameId === gameId);
        if (!game) {
            alert('Game not found.');
            return;
        }

        if (!game.signups || game.signups.length === 0) {
            alert(`No one has signed up for ${game.gameName} yet.`);
            return;
        }

        let signupList = `Signups for ${game.gameName}:\n\n`;
        game.signups.forEach((player, index) => {
            signupList += `${index + 1}. ${player.name}\n   Email: ${player.email}\n\n`;
        });

        alert(signupList);
    };

    const signup = (gameId) => {
        const idx = games.findIndex(g => g.gameId === gameId);
        if (idx === -1) {
            alert('Game not found.');
            return;
        }

        const name = prompt('Enter your name:');
        if (!name || !name.trim()) return;

        const email = prompt('Enter your email:');
        if (!email || !email.trim()) return;

        const updatedGames = [...games];
        updatedGames[idx].signups.push({ name: name.trim(), email: email.trim() });
        updatedGames[idx].playerCount = updatedGames[idx].signups.length;
        saveGames(updatedGames);
        alert(`Successfully joined ${updatedGames[idx].gameName}!`);
    };

    const deleteGame = (gameId) => {
        const idx = games.findIndex(g => g.gameId === gameId);
        if (idx === -1) {
            alert('Game not found.');
            return;
        }

        if (!window.confirm(`Delete ${games[idx].gameName}?`)) return;

        const newGames = games.filter((_, i) => i !== idx);
        saveGames(newGames);
    };

    const filterGames = () => {
        if (!searchText) {
            return games;
        }

        const query = searchText.toLowerCase();
        return games.filter(g => {
            if (searchType === 'all') {
                return (
                    g.gameName.toLowerCase().includes(query) ||
                    g.sport.toLowerCase().includes(query) ||
                    (g.signups && g.signups.some(s => s.name.toLowerCase().includes(query)))
                );
            } else if (searchType === 'name') {
                return g.gameName.toLowerCase().includes(query);
            } else if (searchType === 'sport') {
                return g.sport.toLowerCase().includes(query);
            } else if (searchType === 'player') {
                return g.signups && g.signups.some(s => s.name.toLowerCase().includes(query));
            }
            return true;
        });
    };

    const filteredGames = filterGames();

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Vernball Game Management</h1>
                    <p>Create games, browse events, and manage signups.</p>
                </div>
            </header>

            <main className="container mt-5">
                <div className="row">
                    <div className="col-lg-6">
                        <h2>Add New Game</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Game Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={gameName}
                                    onChange={(e) => setGameName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Sport</label>
                                <select
                                    className="form-select"
                                    value={sport}
                                    onChange={(e) => setSport(e.target.value)}
                                    required
                                >
                                    <option defaultValue="">-- Select Sport --</option>
                                    <option value="Basketball">Basketball</option>
                                    <option value="Football">Football</option>
                                    <option value="Soccer">Soccer</option>
                                    <option value="Baseball">Baseball</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={dateTime}
                                    onChange={(e) => setDateTime(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Location</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary">Create Game</button>
                        </form>
                    </div>

                    <div className="col-lg-6">
                        <h2>Games</h2>
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control mb-2"
                                placeholder="Search games..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                id="gameSearch"
                            />
                            <select
                                className="form-select"
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                id="searchType"
                            >
                                <option value="all">Search All</option>
                                <option value="name">Search by Name</option>
                                <option value="sport">Search by Sport</option>
                                <option value="player">Search by Player</option>
                            </select>
                        </div>

                        <div id="gamesContainer">
                            {filteredGames.length === 0 ? (
                                <div className="alert alert-info">No games added yet. Create one using the form.</div>
                            ) : (
                                filteredGames.map(game => (
                                    <div className="card mb-3" key={game.gameId}>
                                        <div className="card-body">
                                            <h5 className="card-title">{game.gameName}</h5>
                                            <p className="card-text"><strong>Sport:</strong> {game.sport}</p>
                                            <p className="card-text"><strong>Location:</strong> {game.location}</p>
                                            <p className="card-text"><strong>Date & Time:</strong> {formatDateTime(game.dateTime)}</p>
                                            <p className="card-text"><strong>Players signed up:</strong> {game.playerCount}</p>
                                            <button
                                                className="btn btn-info btn-sm me-2"
                                                onClick={() => viewSignups(game.gameId)}
                                            >
                                                View Signups
                                            </button>
                                            <button
                                                className="btn btn-success btn-sm me-2"
                                                onClick={() => signup(game.gameId)}
                                            >
                                                Join
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => deleteGame(game.gameId)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Games;
