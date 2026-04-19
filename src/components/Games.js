import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(window.location.origin);

const Games = () => {
    const [games, setGames] = useState([]);
    const [gameName, setGameName] = useState('');
    const [sport, setSport] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [location, setLocation] = useState('');
    const [searchText, setSearchText] = useState('');
    const [searchType, setSearchType] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchApprovedGames = () => {
        setLoading(true);
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => {
                const approved = data.filter(order => order.status === 'approved');
                setGames(approved);
                setLoading(false);
            })
            .catch(err => { console.error('Error fetching games:', err); setLoading(false); });
    };

    useEffect(() => {
        fetchApprovedGames();

        // Real-time: re-fetch when server broadcasts an order change
        socket.on('orders_updated', fetchApprovedGames);

        return () => socket.off('orders_updated', fetchApprovedGames);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!gameName.trim() || !sport || !dateTime || !location.trim()) { alert('Please fill all fields.'); return; }

        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameName: gameName.trim(), sport, dateTime, location: location.trim(), playerCount: 0, signups: [] })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Game submitted for approval!');
                    setGameName(''); setSport(''); setDateTime(''); setLocation('');
                } else {
                    alert('Error submitting game. Please try again.');
                }
            })
            .catch(err => { console.error('Error submitting game:', err); alert('Error submitting game.'); });
    };

    const deleteGame = (gameId) => {
        if (window.confirm('Are you sure you want to delete this approved game? This action cannot be undone.')) {
            fetch(`/api/orders/${gameId}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => { if (data.success) alert('Game deleted successfully!'); })
                .catch(err => console.error('Error deleting game:', err));
        }
    };

    const formatDateTime = (value) => {
        if (!value) return 'N/A';
        try { return new Date(value).toLocaleString(); } catch { return value; }
    };

    const filterGames = () => {
        if (!searchText) return games;
        const query = searchText.toLowerCase();
        return games.filter(g => {
            if (searchType === 'name') return (g.gameName || '').toLowerCase().includes(query);
            if (searchType === 'sport') return (g.sport || '').toLowerCase().includes(query);
            return (g.gameName || '').toLowerCase().includes(query) || (g.sport || '').toLowerCase().includes(query);
        });
    };

    const filteredGames = filterGames();

    return (
        <div>
            <header className="page-header">
                <div className="container"><h1>Vernball Game Management</h1><p>Create games, browse events, and manage signups.</p></div>
            </header>
            <main className="container mt-5">
                <div className="row">
                    <div className="col-lg-6">
                        <h2>Add New Game</h2>
                        <p className="text-muted">Games must be approved before they appear in the list.</p>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Game Name</label>
                                <input type="text" className="form-control" value={gameName} onChange={(e) => setGameName(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Sport</label>
                                <select className="form-select" value={sport} onChange={(e) => setSport(e.target.value)} required>
                                    <option value="">-- Select Sport --</option>
                                    <option value="Basketball">Basketball</option>
                                    <option value="Football">Football</option>
                                    <option value="Soccer">Soccer</option>
                                    <option value="Baseball">Baseball</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Date & Time</label>
                                <input type="datetime-local" className="form-control" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Location</label>
                                <input type="text" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-primary">Submit for Approval</button>
                        </form>
                    </div>
                    <div className="col-lg-6">
                        <h2>Approved Games</h2>
                        <div className="mb-3">
                            <input type="text" className="form-control mb-2" placeholder="Search games..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                            <select className="form-select" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                                <option value="all">Search All</option>
                                <option value="name">Search by Name</option>
                                <option value="sport">Search by Sport</option>
                            </select>
                        </div>
                        {loading ? <div className="alert alert-info">Loading games...</div> : filteredGames.length === 0 ? (
                            <div className="alert alert-info">No approved games yet.</div>
                        ) : (
                            filteredGames.map(game => (
                                <div className="card mb-3" key={game.id}>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h5 className="card-title mb-0">{game.gameName}</h5>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteGame(game.id)}>
                                                Delete
                                            </button>
                                        </div>
                                        <p className="card-text"><strong>Sport:</strong> {game.sport}</p>
                                        <p className="card-text"><strong>Location:</strong> {game.location}</p>
                                        <p className="card-text"><strong>Date & Time:</strong> {formatDateTime(game.dateTime)}</p>
                                        <span className="badge bg-success">Approved</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Games;
