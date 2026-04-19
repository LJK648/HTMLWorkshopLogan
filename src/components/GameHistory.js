import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(window.location.origin);

const GameHistory = () => {
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchGames = () => {
        setLoading(true);
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => { setGames(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(err => { console.error('Error fetching game history:', err); setLoading(false); });
    };

    useEffect(() => {
        fetchGames();

        // Real-time: re-fetch when server broadcasts an order change
        socket.on('orders_updated', fetchGames);

        return () => socket.off('orders_updated', fetchGames);
    }, []);

    const filteredGames = games.filter(game =>
        (game.id || '').toString().toLowerCase().includes(searchText.toLowerCase()) ||
        (game.sport || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (game.gameName || '').toLowerCase().includes(searchText.toLowerCase())
    );

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'declined': return 'danger';
            default: return 'warning';
        }
    };

    const deleteGame = (gameId) => {
        if (window.confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
            fetch(`/api/orders/${gameId}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => { if (data.success) alert('Game deleted successfully!'); })
                .catch(err => console.error('Error deleting game:', err));
        }
    };

    return (
        <div>
            <header className="page-header">
                <div className="container"><h1>Game History</h1><p>View and track all game submissions.</p></div>
            </header>
            <main className="container mt-5">
                <div className="row">
                    <div className="col-lg-8">
                        <h3 className="mb-4">All Submissions</h3>
                        <div className="mb-3">
                            <input type="text" className="form-control" placeholder="Search by Game ID, Name, or Sport..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                        </div>
                        {loading ? <div className="alert alert-info">Loading history...</div> : filteredGames.length === 0 ? (
                            <div className="alert alert-info">{games.length === 0 ? 'No game submissions yet.' : 'No games match your search.'}</div>
                        ) : (
                            filteredGames.map(game => (
                                <div className="card mb-3 shadow-sm" key={game.id}>
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-0">{game.gameName || 'Unnamed Game'}</h5>
                                            <small className="text-muted">ID: {game.id} | Sport: {game.sport}</small>
                                        </div>
                                        <span className={`badge bg-${getStatusBadgeColor(game.status)}`}>{(game.status || 'pending').toUpperCase()}</span>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <p><strong>Location:</strong> {game.location || 'N/A'}</p>
                                                <p><strong>Submitted:</strong> {game.date ? new Date(game.date).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <div className="col-md-6">
                                                <p><strong>Date & Time:</strong> {game.dateTime ? new Date(game.dateTime).toLocaleString() : 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedGame(selectedGame?.id === game.id ? null : game)}>
                                                {selectedGame?.id === game.id ? 'Hide Details' : 'View Details'}
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteGame(game.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    {selectedGame?.id === game.id && (
                                        <div className="card-footer bg-light">
                                            <h6>Full Submission Details</h6>
                                            <p><strong>Game ID:</strong> {game.id}</p>
                                            <p><strong>Sport:</strong> {game.sport}</p>
                                            <p><strong>Location:</strong> {game.location}</p>
                                            <p><strong>Date & Time:</strong> {game.dateTime ? new Date(game.dateTime).toLocaleString() : 'N/A'}</p>
                                            <p><strong>Status:</strong> <span className={`badge bg-${getStatusBadgeColor(game.status)}`}>{game.status || 'pending'}</span></p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="col-lg-4">
                        <div className="card shadow-sm">
                            <div className="card-header bg-light"><h5 className="mb-0">Submission Statistics</h5></div>
                            <div className="card-body">
                                <p className="mb-2"><strong>Total Submissions:</strong> {games.length}</p>
                                <p className="mb-2"><strong>Pending:</strong> {games.filter(o => !o.status || o.status === 'pending').length}</p>
                                <p className="mb-2"><strong>Approved:</strong> {games.filter(o => o.status === 'approved').length}</p>
                                <p className="mb-2"><strong>Declined:</strong> {games.filter(o => o.status === 'declined').length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GameHistory;
