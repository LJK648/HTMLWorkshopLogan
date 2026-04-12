import React, { useState, useEffect } from 'react';

const GAMES_STORAGE_KEY = 'vernball_games_history';

const GameApprovalPage = () => {
    const [games, setGames] = useState([]);
    const [filter, setFilter] = useState('all');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('danger');

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = () => {
        const json = localStorage.getItem(GAMES_STORAGE_KEY);
        if (json) {
            try {
                const saved = JSON.parse(json);
                setGames(Array.isArray(saved) ? saved : []);
            } catch (error) {
                console.error('Error reading games', error);
            }
        }
    };

    const saveGames = (newGames) => {
        localStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(newGames));
        setGames(newGames);
    };

    const updateOrderStatus = (gameId, newStatus) => {
        const updatedGames = games.map(game =>
            game.id === gameId ? { ...game, status: newStatus } : game
        );
        saveGames(updatedGames);
        showMessage(`Game ${gameId} marked as ${newStatus}`, 'success');
    };

    const deleteOrder = (gameId) => {
        if (!window.confirm('Are you sure you want to delete this game?')) return;
        const newGames = games.filter(game => game.id !== gameId);
        saveGames(newGames);
        showMessage('Game deleted', 'success');
    };

    const showMessage = (msg, type = 'danger') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const filteredOrders = filter === 'all'
        ? games
        : games.filter(game => game.status === filter);

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Game Approval Management</h1>
                    <p>Review and manage all game requests.</p>
                </div>
            </header>

            <main className="container mt-5">
                {message && (
                    <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
                        {message}
                        <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                    </div>
                )}

                <div className="mb-4">
                    <h3>Filter Orders</h3>
                    <div className="btn-group" role="group">
                        {['all', 'pending', 'approved', 'rejected', 'completed'].map(status => (
                            <button
                                key={status}
                                type="button"
                                className={`btn ${filter === status ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="alert alert-info">No games found.</div>
                ) : (
                    <div className="row">
                        {filteredOrders.map(game => (
                            <div className="col-md-6 col-lg-4 mb-4" key={game.id}>
                                <div className="card shadow-sm">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0">Game #{game.id}</h5>
                                        <small className="text-muted">Sport: {game.sport}</small>
                                    </div>
                                    <div className="card-body">
                                        <p><strong>Players:</strong> {game.players?.length || 0}</p>
                                        <p><strong>Signups:</strong> {game.signups || 0}</p>
                                        <p>
                                            <strong>Status:</strong>{' '}
                                            <span className={`badge bg-${
                                                game.status === 'approved' ? 'success' :
                                                game.status === 'rejected' ? 'danger' :
                                                game.status === 'completed' ? 'info' :
                                                'warning'
                                            }`}>
                                                {game.status || 'pending'}
                                            </span>
                                        </p>
                                        <p><small className="text-muted">Created: {new Date(game.createdAt).toLocaleDateString()}</small></p>
                                    </div>
                                    <div className="card-footer">
                                        {game.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-success me-2"
                                                    onClick={() => updateOrderStatus(game.id, 'approved')}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => updateOrderStatus(game.id, 'rejected')}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {game.status === 'approved' && (
                                            <button
                                                className="btn btn-sm btn-info"
                                                onClick={() => updateOrderStatus(game.id, 'completed')}
                                            >
                                                Mark Complete
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-sm btn-outline-danger ms-2"
                                            onClick={() => deleteOrder(game.id)}
                                        >
                                            Delete
                                        </button>
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
