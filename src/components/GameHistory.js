import React, { useState, useEffect } from 'react';

const GAMES_STORAGE_KEY = 'vernball_games_history';

const GameHistory = () => {
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [searchText, setSearchText] = useState('');

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

    const filteredGames = games.filter(game =>
        game.id.toString().includes(searchText) ||
        game.sport.toLowerCase().includes(searchText.toLowerCase())
    );

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'approved':
                return 'info';
            case 'rejected':
                return 'danger';
            case 'pending':
            default:
                return 'warning';
        }
    };

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Game History</h1>
                    <p>View and track all games.</p>
                </div>
            </header>

            <main className="container mt-5">
                <div className="row">
                    <div className="col-lg-8">
                        <h3 className="mb-4">Games</h3>

                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by Game ID or Sport..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>

                        {filteredGames.length === 0 ? (
                            <div className="alert alert-info">
                                {games.length === 0 ? 'No games yet.' : 'No games match your search.'}
                            </div>
                        ) : (
                            <div>
                                {filteredGames.map(game => (
                                    <div className="card mb-3 shadow-sm" key={game.id}>
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="mb-0">Game #{game.id}</h5>
                                                <small className="text-muted">Sport: {game.sport}</small>
                                            </div>
                                            <span className={`badge bg-${getStatusBadgeColor(game.status)}`}>
                                                {(game.status || 'pending').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <p><strong>Players:</strong> {game.players?.length || 0}</p>
                                                    <p><strong>Game Date:</strong> {new Date(game.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="col-md-6 text-md-end">
                                                    <p><strong>Signups:</strong> <span className="h5 text-primary">{game.signups || 0}</span></p>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => setSelectedGame(selectedGame?.id === game.id ? null : game)}
                                            >
                                                {selectedGame?.id === game.id ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </div>

                                        {selectedGame?.id === game.id && (
                                            <div className="card-footer bg-light">
                                                <h6>Game Details</h6>
                                                {game.players && game.players.length > 0 ? (
                                                    <ul className="list-unstyled">
                                                        {game.players.map((player, idx) => (
                                                            <li key={idx} className="pb-2">
                                                                <span className="me-3">{player.name || `Player ${idx + 1}`}</span>
                                                                <span className="text-muted">Position: {player.position || 'N/A'}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-muted">No players in this game.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="col-lg-4">
                        <div className="card shadow-sm">
                            <div className="card-header bg-light">
                                <h5 className="mb-0">Game Statistics</h5>
                            </div>
                            <div className="card-body">
                                <p className="mb-2">
                                    <strong>Total Games:</strong> {games.length}
                                </p>
                                <p className="mb-2">
                                    <strong>Pending:</strong> {games.filter(o => o.status === 'pending' || !o.status).length}
                                </p>
                                <p className="mb-2">
                                    <strong>Approved:</strong> {games.filter(o => o.status === 'approved').length}
                                </p>
                                <p className="mb-2">
                                    <strong>Completed:</strong> {games.filter(o => o.status === 'completed').length}
                                </p>
                                <p className="mb-2">
                                    <strong>Cancelled:</strong> {games.filter(o => o.status === 'cancelled').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GameHistory;
