import React, { useState, useEffect } from 'react';

const PLAYERS_STORAGE_KEY = 'vernball_players';
const TEAMS_STORAGE_KEY = 'vernball_teams';

const TeamsList = () => {
    const [teams, setTeams] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('danger');

    // Load teams and players from localStorage
    useEffect(() => {
        loadTeams();
        loadPlayers();
    }, []);

    const loadTeams = () => {
        const json = localStorage.getItem(TEAMS_STORAGE_KEY);
        if (json) {
            try {
                const saved = JSON.parse(json);
                setTeams(Array.isArray(saved) ? saved : []);
            } catch (error) {
                console.error('Error reading teams', error);
            }
        }
    };

    const loadPlayers = () => {
        const json = localStorage.getItem(PLAYERS_STORAGE_KEY);
        if (json) {
            try {
                const saved = JSON.parse(json);
                setAllPlayers(Array.isArray(saved) ? saved : []);
            } catch (error) {
                console.error('Error reading players', error);
            }
        }
    };

    const saveTeams = (newTeams) => {
        localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(newTeams));
        setTeams(newTeams);
    };

    const showMessage = (msg, type = 'danger') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const getPlayerSports = (player) => {
        return Array.isArray(player.sports) ? player.sports : [];
    };

    const getPlayerPositionForSport = (player, sport) => {
        const sportPositions = player.sportPositions || {};
        return sportPositions[sport] || player.position || 'N/A';
    };

    const countTeamsForPlayer = (playerEmail) => {
        return teams.reduce((count, team) => {
            if (team.players && Array.isArray(team.players)) {
                return count + (team.players.some(p => p.email === playerEmail) ? 1 : 0);
            }
            return count;
        }, 0);
    };

    const getMaxTeamsForPlayer = (player) => {
        const sports = getPlayerSports(player);
        return Math.max(1, Math.min(sports.length, 3));
    };

    const removePlayerFromTeam = (teamId, playerEmail) => {
        if (!window.confirm('Remove this player from the roster?')) return;

        const teamIndex = teams.findIndex(t => t.teamId === teamId);
        if (teamIndex === -1) {
            showMessage('Team not found.', 'warning');
            return;
        }

        const team = teams[teamIndex];
        const playerIndex = team.players.findIndex(p => p.email === playerEmail);

        if (playerIndex === -1) {
            showMessage('Player not found in team.', 'warning');
            return;
        }

        const playerName = team.players[playerIndex].fullName;

        if (team.players.length === 1) {
            showMessage('Cannot remove the last player from a team. Delete the team instead.', 'warning');
            return;
        }

        team.players.splice(playerIndex, 1);
        saveTeams([...teams]);
        showMessage(`${playerName} removed from roster.`, 'success');
    };

    const deleteTeam = (teamId) => {
        if (!window.confirm('Delete this entire team? This action cannot be undone.')) return;

        const teamIndex = teams.findIndex(t => t.teamId === teamId);
        if (teamIndex === -1) {
            showMessage('Team not found.', 'warning');
            return;
        }

        const teamName = teams[teamIndex].teamName;
        const newTeams = teams.filter((_, i) => i !== teamIndex);
        saveTeams(newTeams);
        showMessage(`Team "${teamName}" deleted successfully.`, 'success');
    };

    const formatDate = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch {
            return isoString;
        }
    };

    const renderTeamRoster = (team) => {
        return team.players.map((teamPlayer, idx) => {
            const playerData = allPlayers.find(p => p.email === teamPlayer.email) || {
                fullName: teamPlayer.fullName,
                email: teamPlayer.email,
                sports: [team.sport],
                sportPositions: {}
            };

            const teamCount = countTeamsForPlayer(teamPlayer.email);
            const maxTeams = getMaxTeamsForPlayer(playerData);
            const availableSlots = Math.max(0, maxTeams - teamCount);
            const playerPosition = getPlayerPositionForSport(playerData, team.sport) || teamPlayer.position || 'N/A';

            return (
                <div className="card mb-2" key={idx}>
                    <div className="card-body d-flex justify-content-between align-items-center">
                        <div>
                            <strong>{teamPlayer.fullName}</strong>
                            <p className="mb-1 text-muted">{teamPlayer.sport} &#8226; {playerPosition}</p>
                            <p className="mb-0 text-muted"><small>{teamPlayer.email}</small></p>
                            <p className="mb-0 text-muted"><small>Available team slots: {availableSlots}/{maxTeams}</small></p>
                        </div>
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => removePlayerFromTeam(team.teamId, teamPlayer.email)}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            );
        });
    };

    if (teams.length === 0) {
        return (
            <div>
                <header className="page-header">
                    <div className="container">
                        <h1>Team Management</h1>
                        <p>View and manage all teams.</p>
                    </div>
                </header>
                <main className="container mt-5">
                    <div className="alert alert-info">
                        No teams created yet. <a href="/team-builder">Create a team</a>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Team Management</h1>
                    <p>View and manage all teams.</p>
                </div>
            </header>

            <main className="container mt-5">
                {message && (
                    <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
                        {message}
                        <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                    </div>
                )}

                <div id="teamsList">
                    {teams.map(team => {
                        const createdDate = formatDate(team.createdAt);
                        const playerCount = (team.players && team.players.length) || 0;

                        return (
                            <div className="card mb-4 shadow-sm" key={team.teamId}>
                                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="mb-0">{team.teamName}</h5>
                                        <small className="text-muted">
                                            {team.sport} | {playerCount} player(s) | Created: {createdDate}
                                        </small>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => deleteTeam(team.teamId)}
                                    >
                                        Delete Team
                                    </button>
                                </div>
                                <div className="card-body">
                                    <h6 className="mb-3">Roster</h6>
                                    {renderTeamRoster(team)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default TeamsList;
