import React, { useState, useEffect } from 'react';

const STORAGE_KEY = "vernball_players";

// Sport to positions mapping
const SPORT_POSITIONS = {
    Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    Football: ["Quarterback", "Running Back", "Wide Receiver", "Tight End", "Offensive Lineman", "Defensive End", "Linebacker", "Defensive Back"],
    Soccer: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    Baseball: ["Pitcher", "Catcher", "Infielder", "Outfielder"]
};

function loadPlayers() {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    try {
        const saved = JSON.parse(json);
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error('Error reading players from localStorage', error);
        return [];
    }
}

function savePlayers(players) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

const PlayerRegistration = () => {
    const [players, setPlayers] = useState([]);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        sports: [],
        sportPositions: {}
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('all');
    const [response, setResponse] = useState(null);

    useEffect(() => {
        setPlayers(loadPlayers());
    }, []);

    const updatePositionOptions = (selectedSports) => {
        const sportPositions = {};
        selectedSports.forEach(sport => {
            sportPositions[sport] = formData.sportPositions[sport] || '';
        });
        setFormData(prev => ({ ...prev, sportPositions }));
    };

    const handleSportChange = (e) => {
        const selectedSports = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, sports: selectedSports }));
        updatePositionOptions(selectedSports);
    };

    const handlePositionChange = (sport, position) => {
        setFormData(prev => ({
            ...prev,
            sportPositions: { ...prev.sportPositions, [sport]: position }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.fullName || !formData.email || !formData.sports.length) {
            alert('Please fill in all fields and select at least one sport.');
            return;
        }

        if (formData.sports.length > 4) {
            alert('You can select up to 4 sports.');
            return;
        }

        // Validate that each sport has a position
        for (const sport of formData.sports) {
            if (!formData.sportPositions[sport]) {
                alert(`Please select a position for ${sport}.`);
                return;
            }
        }

        // Log the form data as JSON
        console.log('Player Registration Form Submission:', JSON.stringify(formData, null, 2));

        // Perform AJAX fetch call
        fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
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

        const newPlayers = [...players, formData];
        setPlayers(newPlayers);
        savePlayers(newPlayers);

        // Reset form
        setFormData({
            fullName: '',
            email: '',
            sports: [],
            sportPositions: {}
        });
        alert('Player registered!');
    };

    const deletePlayer = (index) => {
        if (!window.confirm(`Delete player ${players[index].fullName}?`)) return;
        const newPlayers = players.filter((_, i) => i !== index);
        setPlayers(newPlayers);
        savePlayers(newPlayers);
    };

    const filterPlayers = (query, type) => {
        if (!query) return players;

        const text = query.toLowerCase();
        let filtered = [];

        if (type === 'all') {
            filtered = players.filter(p => {
                const sports = Array.isArray(p.sports) ? p.sports : [p.sport].filter(Boolean);
                const positions = Object.values(p.sportPositions || {}).join(' ').toLowerCase();
                return (
                    p.fullName.toLowerCase().includes(text) ||
                    positions.includes(text) ||
                    sports.some(s => s.toLowerCase().includes(text))
                );
            });
        } else if (type === 'name') {
            filtered = players.filter(p => p.fullName.toLowerCase().includes(text));
        } else if (type === 'sport') {
            filtered = players.filter(p => {
                const sports = Array.isArray(p.sports) ? p.sports : [p.sport].filter(Boolean);
                return sports.some(s => s.toLowerCase().includes(text));
            });
        } else if (type === 'position') {
            filtered = players.filter(p => {
                const positions = Object.values(p.sportPositions || {}).join(' ').toLowerCase();
                return positions.includes(text);
            });
        }

        return filtered;
    };

    const displayedPlayers = filterPlayers(searchQuery, searchType);

    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-lg-6">
                    <h2>Register a New Player</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                name="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="sports" className="form-label">Sports (select up to 4)</label>
                            <select
                                className="form-select"
                                id="sports"
                                name="sports"
                                multiple
                                size="4"
                                value={formData.sports}
                                onChange={handleSportChange}
                                required
                            >
                                <option value="Basketball">Basketball</option>
                                <option value="Football">Football</option>
                                <option value="Soccer">Soccer</option>
                                <option value="Baseball">Baseball</option>
                            </select>
                            <small className="form-text text-muted">Use Ctrl/Cmd + click to select multiple sports (max 4)</small>
                        </div>
                        {formData.sports.length > 0 && (
                            <div id="sportPositionsContainer">
                                <h5>Select Position for Each Sport</h5>
                                <div id="sportPositions">
                                    {formData.sports.map(sport => (
                                        <div key={sport} className="mb-3">
                                            <label htmlFor={`position_${sport}`} className="form-label">{sport}</label>
                                            <select
                                                className="form-select sport-position-select"
                                                id={`position_${sport}`}
                                                value={formData.sportPositions[sport] || ''}
                                                onChange={(e) => handlePositionChange(sport, e.target.value)}
                                                required
                                            >
                                                <option value="">-- Select Position --</option>
                                                {SPORT_POSITIONS[sport]?.map(pos => (
                                                    <option key={pos} value={pos}>{pos}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary">Register</button>
                    </form>
                    {response && <pre>{response}</pre>}
                </div>
                <div className="col-lg-6">
                    <h2>Registered Players</h2>
                    <div className="mb-3">
                        <label className="form-label" htmlFor="searchType">Search By:</label>
                        <select
                            className="form-select"
                            id="searchType"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            <option value="all">All Fields</option>
                            <option value="name">Player Name</option>
                            <option value="sport">Sport</option>
                            <option value="position">Position</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label" htmlFor="playerSearch">Search Players</label>
                        <input
                            className="form-control"
                            id="playerSearch"
                            type="search"
                            placeholder="Enter name, sport, or position"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div id="playersContainer">
                        {displayedPlayers.length === 0 ? (
                            <div className="alert alert-info">No registered players yet.</div>
                        ) : (
                            displayedPlayers.map((player, index) => {
                                const sports = Array.isArray(player.sports) ? player.sports : [player.sport].filter(Boolean);
                                const sportsText = sports.length ? sports.join(', ') : 'No sports';
                                const sportPositions = player.sportPositions || {};
                                const positionsText = sports.length > 0 ? sports.map(sport => {
                                    const pos = sportPositions[sport] || 'N/A';
                                    return `${sport}: ${pos}`;
                                }).join(' | ') : 'No positions';

                                return (
                                    <div key={index} className="card mb-2">
                                        <div className="card-body d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="card-title mb-1">{player.fullName}</h5>
                                                <p className="card-text mb-1">Email: {player.email}</p>
                                                <p className="card-text mb-1">Sports: {sportsText}</p>
                                                <p className="card-text mb-0">Positions: {positionsText}</p>
                                            </div>
                                            <button className="btn btn-danger btn-sm" onClick={() => deletePlayer(index)}>Delete</button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerRegistration;