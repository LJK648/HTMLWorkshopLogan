import React, { useState, useEffect } from 'react';

const PLAYERS_STORAGE_KEY = 'vernball_players';
const TEAMS_STORAGE_KEY = 'vernball_teams';

const TeamBuilder = () => {
    const [allPlayers, setAllPlayers] = useState([]);
    const [roster, setRoster] = useState([]);
    const [teamName, setTeamName] = useState('');
    const [teamSport, setTeamSport] = useState('all');
    const [currentTeamSport, setCurrentTeamSport] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('danger');

    // Load players from localStorage
    useEffect(() => {
        const json = localStorage.getItem(PLAYERS_STORAGE_KEY);
        if (json) {
            try {
                const saved = JSON.parse(json);
                setAllPlayers(Array.isArray(saved) ? saved : []);
            } catch (error) {
                console.error('Error reading players', error);
            }
        }
    }, []);

    const getPlayerSports = (player) => {
        return Array.isArray(player.sports) ? player.sports : [];
    };

    const getPlayerPositionForSport = (player, sport) => {
        const sportPositions = player.sportPositions || {};
        return sportPositions[sport] || player.position || 'N/A';
    };

    const getRosterSport = () => {
        if (!roster.length) return null;
        return roster[0].sport || getPlayerSports(roster[0])[0] || 'Unknown';
    };

    const countTeamsForPlayer = (playerEmail) => {
        const json = localStorage.getItem(TEAMS_STORAGE_KEY);
        if (!json) return 0;
        try {
            const teams = JSON.parse(json);
            return teams.reduce((count, team) => {
                if (team.players && Array.isArray(team.players)) {
                    return count + (team.players.some(p => p.email === playerEmail) ? 1 : 0);
                }
                return count;
            }, 0);
        } catch {
            return 0;
        }
    };

    const getMaxTeamsForPlayer = (player) => {
        const sports = getPlayerSports(player);
        return Math.max(1, Math.min(sports.length, 4));
    };

    const showMessage = (msg, type = 'danger') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const addPlayerToRoster = (player) => {
        const playerEmail = player.email;
        const teamCount = countTeamsForPlayer(playerEmail);
        const maxTeams = getMaxTeamsForPlayer(player);

        if (roster.some(r => r.email === playerEmail)) {
            showMessage('Player already in roster.', 'warning');
            return;
        }

        if (teamCount >= maxTeams) {
            showMessage(`Player has reached max team limit (${maxTeams}).`, 'warning');
            return;
        }

        const playerSports = getPlayerSports(player);
        const rosterSport = getRosterSport();

        if (rosterSport && rosterSport !== 'all') {
            if (!playerSports.includes(rosterSport)) {
                showMessage('Player not registered for roster sport.', 'warning');
                return;
            }
        }

        if (currentTeamSport !== 'all' && rosterSport === null) {
            if (!playerSports.includes(currentTeamSport)) {
                showMessage('Player not registered for selected sport.', 'warning');
                return;
            }
            const sport = currentTeamSport;
            const position = getPlayerPositionForSport(player, sport);
            setRoster([...roster, { ...player, sport, position }]);
            if (currentTeamSport === 'all') setCurrentTeamSport(sport);
            return;
        }

        setRoster([...roster, player]);
    };

    const removePlayerFromRoster = (email) => {
        setRoster(roster.filter(r => r.email !== email));
    };

    const createTeam = () => {
        if (!teamName.trim()) {
            showMessage('Please enter a team name.', 'danger');
            return;
        }

        const rosterSport = getRosterSport();
        if (!rosterSport || roster.length === 0) {
            showMessage('Select at least one player for the team.', 'danger');
            return;
        }

        const newTeam = {
            teamId: Date.now(),
            teamName: teamName.trim(),
            sport: rosterSport,
            players: roster.map(p => ({
                fullName: p.fullName,
                email: p.email,
                sport: rosterSport,
                position: getPlayerPositionForSport(p, rosterSport)
            })),
            createdAt: new Date().toISOString()
        };

        const json = localStorage.getItem(TEAMS_STORAGE_KEY);
        let teams = [];
        if (json) {
            try {
                teams = JSON.parse(json);
            } catch (error) {
                console.error('Error parsing teams', error);
            }
        }

        teams.push(newTeam);
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));

        showMessage(`Team "${teamName}" created successfully!`, 'success');
        setTeamName('');
        setRoster([]);
        setCurrentTeamSport('all');
        setTeamSport('all');
    };

    const renderPlayerPool = () => {
        const search = searchText.toLowerCase();
        const selectedSport = teamSport || 'all';

        const filtered = allPlayers.filter(player => {
            const sports = getPlayerSports(player);
            const sportsText = sports.join(' ').toLowerCase();
            const matchSearch = !search ||
                player.fullName.toLowerCase().includes(search) ||
                sportsText.includes(search) ||
                (player.position || '').toLowerCase().includes(search) ||
                player.email.toLowerCase().includes(search);

            const matchSport = selectedSport === 'all' || sports.includes(selectedSport);

            return matchSearch && matchSport;
        });

        if (filtered.length === 0) {
            return <div className="alert alert-secondary">No players match your search and/or sport filter.</div>;
        }

        const rosterSport = getRosterSport();

        return filtered.map(player => {
            const playerEmail = player.email;
            const teamCount = countTeamsForPlayer(playerEmail);
            const maxTeams = getMaxTeamsForPlayer(player);
            const inRoster = roster.some(r => r.email === playerEmail);
            const playerSports = getPlayerSports(player);

            let disabled = inRoster || teamCount >= maxTeams;
            let reasonText = teamCount >= maxTeams ? ` (Max ${maxTeams} teams reached)` : '';

            if (!disabled && rosterSport && rosterSport !== 'all') {
                if (!playerSports.includes(rosterSport)) {
                    disabled = true;
                    reasonText = ' (Not registered for roster sport)';
                }
            }

            return (
                <div key={playerEmail} className="mb-2 d-flex justify-content-between align-items-center">
                    <span>
                        {player.fullName} ({playerSports.join(', ')}) {reasonText}
                    </span>
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addPlayerToRoster(player)}
                        disabled={disabled}
                    >
                        Add
                    </button>
                </div>
            );
        });
    };

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Team Builder</h1>
                    <p>Create and manage teams by selecting players.</p>
                </div>
            </header>

            <main className="container mt-5">
                <div className="row">
                    <div className="col-lg-6">
                        <h2>Build Your Team</h2>

                        {message && (
                            <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
                                {message}
                                <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label">Team Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter team name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                            />
                        </div>

                        <h4>Roster ({roster.length})</h4>
                        <div className="border p-3 mb-3" style={{ minHeight: '200px' }}>
                            {roster.length === 0 ? (
                                <p className="text-muted">No players added yet.</p>
                            ) : (
                                roster.map((player, idx) => (
                                    <div key={idx} className="d-flex justify-content-between align-items-center mb-2">
                                        <span>{player.fullName}</span>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => removePlayerFromRoster(player.email)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="btn btn-success" onClick={createTeam}>
                            Create Team
                        </button>
                    </div>

                    <div className="col-lg-6">
                        <h2>Available Players</h2>

                        <div className="mb-3">
                            <label className="form-label">Filter by Sport</label>
                            <select
                                className="form-select"
                                value={teamSport}
                                onChange={(e) => setTeamSport(e.target.value)}
                                id="teamSportFilter"
                            >
                                <option value="all">All Sports</option>
                                <option value="Basketball">Basketball</option>
                                <option value="Football">Football</option>
                                <option value="Soccer">Soccer</option>
                                <option value="Baseball">Baseball</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search players..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>

                        <div id="teamBuilderList">
                            {renderPlayerPool()}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeamBuilder;
