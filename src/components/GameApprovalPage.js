import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(window.location.origin);

const GameApprovalPage = () => {
    const [games, setGames] = useState([]);
    const [filter, setFilter] = useState('all');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [loading, setLoading] = useState(true);

    const fetchGames = () => {
        setLoading(true);
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => { setGames(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(err => { console.error('Error fetching games:', err); setLoading(false); });
    };

    useEffect(() => {
        fetchGames();

        // Real-time: re-fetch when server broadcasts an order change
        socket.on('orders_updated', fetchGames);

        return () => socket.off('orders_updated', fetchGames);
    }, []);

    const approveGame = (gameId) => {
        fetch(`/api/orders/${gameId}/approve`, { method: 'PUT' })
            .then(res => res.json())
            .then(data => { if (data.success) showMessage('Game approved successfully!', 'success'); })
            .catch(err => console.error('Error approving game:', err));
    };

    const declineGame = (gameId) => {
        fetch(`/api/orders/${gameId}/decline`, { method: 'PUT' })
            .then(res => res.json())
            .then(data => { if (data.success) showMessage('Game declined.', 'warning'); })
            .catch(err => console.error('Error declining game:', err));
    };

    const showMessage = (msg, type = 'success') => {
        setMessage(msg); setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const filteredGames = filter === 'all' ? games : games.filter(game => game.status === filter);

    return (
        <div>
            <header className="page-header">
                <div className="container"><h1>Game Approval Management</h1><p>Review and manage all game requests.</p></div>
            </header>
            <main className="container mt-5">
                {message && (
                    <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
                        {message}<button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                    </div>
                )}
                <div className="mb-4">
                    <h3>Filter by Status</h3>
                    <div className="btn-group" role="group">
                        {['all', 'pending', 'approved', 'declined'].map(status => (
                            <button key={status} type="button" className={`btn ${filter === status ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter(status)}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                {loading ? <div className="alert alert-info">Loading games...</div> : filteredGames.length === 0 ? <div className="alert alert-info">No games found.</div> : (
                    <div className="row">
                        {filteredGames.map(game => (
                            <div className="col-md-6 col-lg-4 mb-4" key={game.id}>
                                <div className="card shadow-sm">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0">{game.gameName || 'Unnamed Game'}</h5>
                                        <small className="text-muted">Sport: {game.sport}</small>
                                    </div>
                                    <div className="card-body">
                                        <p><strong>Location:</strong> {game.location || 'N/A'}</p>
                                        <p><strong>Date & Time:</strong> {game.dateTime ? new Date(game.dateTime).toLocaleString() : 'N/A'}</p>
                                        <p><strong>Order ID:</strong> {game.id}</p>
                                        <p><strong>Status:</strong>{' '}
                                            <span className={`badge bg-${game.status === 'approved' ? 'success' : game.status === 'declined' ? 'danger' : 'warning'}`}>
                                                {game.status || 'pending'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="card-footer">
                                        {(game.status === 'pending' || !game.status) && (
                                            <>
                                                <button className="btn btn-sm btn-success me-2" onClick={() => approveGame(game.id)}>Approve</button>
                                                <button className="btn btn-sm btn-danger" onClick={() => declineGame(game.id)}>Decline</button>
                                            </>
                                        )}
                                        {game.status === 'approved' && <span className="text-success fw-bold">✓ Approved</span>}
                                        {game.status === 'declined' && <span className="text-danger fw-bold">✗ Declined</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default GameApprovalPage;
