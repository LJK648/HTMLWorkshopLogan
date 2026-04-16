import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SPORT_POSITIONS = {
    Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    Football: ["Quarterback", "Running Back", "Wide Receiver", "Tight End", "Offensive Lineman", "Defensive End", "Linebacker", "Defensive Back"],
    Soccer: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    Baseball: ["Pitcher", "Catcher", "Infielder", "Outfielder"]
};

const API_URL = process.env.REACT_APP_API_URL || '';

const socket = io(window.location.origin);

const PlayerRegistration = () => {
    const [players, setPlayers] = useState([]);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedSports, setSelectedSports] = useState([]);
    const [sportPositions, setSportPositions] = useState({});
    const [showPositions, setShowPositions] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/players`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data);
            }
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    useEffect(() => {
        fetchPlayers();

        // Real-time: re-fetch when server broadcasts a player change
        socket.on('players_updated', fetchPlayers);

        return () => socket.off('players_updated', fetchPlayers);
    }, []);

    const handleSportChange = (e) => {
        const sport = e.target.value;
        const checked = e.target.checked;
        let newSports = [...selectedSports];

        if (checked) {
            newSports.push(sport);
        } else {
            newSports = newSports.filter(s => s !== sport);
        }

        if (newSports.length > 4) {
            alert('You can select up to 4 sports.');
            e.target.checked = false;
            return;
        }

        setSelectedSports(newSports);
        setShowPositions(newSports.length > 0);
        if (newSports.length === 0) setSportPositions({});
    };

    const handlePositionChange = (e, sport) => {
        setSportPositions({ ...sportPositions, [sport]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fullName.trim() || !email.trim() || selectedSports.length === 0) {
            alert('Please fill in all fields and select at least one sport.');
            return;
        }

        for (const sport of selectedSports) {
            if (!sportPositions[sport] || sportPositions[sport] === '-- Select Position --') {
                alert(`Please select a position for ${sport}.`);
                return;
            }
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    email: email.trim(),
                    sports: selectedSports,
                    sportPositions: sportPositions
                })
            });

            if (response.ok) {
                setFullName('');
                setEmail('');
                setSelectedSports([]);
                setSportPositions({});
                setShowPositions(false);
                alert('Player registered!');
                await fetchPlayers();
            } else {
                alert('Error registering player');
            }
        } catch (error) {
            console.error('Error submitting player:', error);
            alert('Error registering player: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const deletePlayer = async (playerId) => {
        if (!window.confirm('Delete this player?')) return;
        try {
            const response = await fetch(`${API_URL}/api/players/${playerId}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchPlayers();
            } else {
                alert('Error deleting player');
            }
        } catch (error) {
            console.error('Error deleting player:', error);
            alert('Error deleting player: ' + error.message);
        }
    };

    const filterPlayers = (query) => {
        if (!query) return players;
        const text = query.toLowerCase();
        return players.filter(p => {
            const positions = Object.values(p.sportPositions || {}).join(' ').toLowerCase();
            return (
                p.fullName.toLowerCase().includes(text) ||
                positions.includes(text) ||
                p.email.toLowerCase().includes(text)
            );
        });
    };

    const filteredPlayers = filterPlayers(searchText);

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Player Registration</h1>
                    <p>Register new players and manage their sport positions.</p>
                </div>
            </header>

            <main className="container mt-5">
                <div className="row">
                    <div className="col-lg-6">
                        <h2>Add New Player</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Sports</label>
                                <div>
                                    {Object.keys(SPORT_POSITIONS).map(sport => (
                                        <div className="form-check" key={sport}>
                                            <input className="form-check-input" type="checkbox" value={sport} checked={selectedSports.includes(sport)} onChange={handleSportChange} id={sport} />
                                            <label className="form-check-label" htmlFor={sport}>{sport}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {showPositions && (
                                <div id="sportPositionsContainer">
                                    <h4>Positions by Sport</h4>
                                    {selectedSports.map(sport => (
                                        <div className="mb-3" key={sport}>
                                            <label className="form-label">{sport}</label>
                                            <select className="form-select" value={sportPositions[sport] || ''} onChange={(e) => handlePositionChange(e, sport)} required>
                                                <option defaultValue>-- Select Position --</option>
                                                {SPORT_POSITIONS[sport].map(pos => (
                                                    <option key={pos} value={pos}>{pos}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Registering...' : 'Register Player'}
                            </button>
                        </form>
                    </div>

                    <div className="col-lg-6">
                        <h2>Registered Players</h2>
                        <div className="mb-3">
                            <input type="text" className="form-control" placeholder="Search players..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                        </div>
                        <div id="playersContainer">
                            {filteredPlayers.length === 0 ? (
                                <div className="alert alert-info">No registered players yet.</div>
                            ) : (
                                filteredPlayers.map((player) => {
                                    const sports = Array.isArray(player.sports) ? player.sports : [player.sport].filter(Boolean);
                                    const sportsText = sports.length ? sports.join(', ') : 'No sports';
                                    const sp = player.sportPositions || {};
                                    const positionsText = sports.length ? sports.map(s => `${s}: ${sp[s] || 'N/A'}`).join(' | ') : 'No positions';
                                    return (
                                        <div className="card mb-2" key={player.id}>
                                            <div className="card-body d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="card-title mb-1">{player.fullName}</h5>
                                                    <p className="card-text mb-1">Email: {player.email}</p>
                                                    <p className="card-text mb-1">Sports: {sportsText}</p>
                                                    <p className="card-text mb-0">Positions: {positionsText}</p>
                                                </div>
                                                <button className="btn btn-danger btn-sm" onClick={() => deletePlayer(player.id)}>Delete</button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerRegistration;
