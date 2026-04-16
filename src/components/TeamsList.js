import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || '';

const socket = io(window.location.origin);

const TeamsList = () => {
    const [teams, setTeams] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('danger');
    const [loading, setLoading] = useState(false);

    const fetchTeams = async () => {
        try {
            const response = await fetch(`${API_URL}/api/teams`);
            if (response.ok) setTeams(await response.json());
        } catch (error) { console.error('Error fetching teams:', error); }
    };

    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/players`);
            if (response.ok) setAllPlayers(await response.json());
        } catch (error) { console.error('Error fetching players:', error); }
    };

    useEffect(() => {
        fetchTeams();
        fetchPlayers();

        // Real-time: re-fetch when server broadcasts changes
        socket.on('teams_updated', fetchTeams);
        socket.on('players_updated', fetchPlayers);

        return () => {
            socket.off('teams_updated', fetchTeams);
            socket.off('players_updated', fetchPlayers);
        };
    }, []);

    const showMessage = (msg, type = 'danger') => {
        setMessage(msg); setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const getPlayerSports = (player) => Array.isArray(player.sports) ? player.sports : [];
    const getPlayerPositionForSport = (player, sport) => { const sp = player.sportPositions || {}; return sp[sport] || player.position || 'N/A'; };
    const countTeamsForPlayer = (playerEmail) => teams.reduce((count, team) => count + (team.players?.some(p => p.email === playerEmail) ? 1 : 0), 0);
    const getMaxTeamsForPlayer = (player) => Math.max(1, Math.min(getPlayerSports(player).length, 3));

    const removePlayerFromTeam = async (teamId, playerEmail) => {
        if (!window.confirm('Remove this player from the roster?')) return;
        const team = teams.find(t => t.id === teamId);
        if (!team) { showMessage('Team not found.', 'warning'); return; }
        const playerIndex = team.players.findIndex(p => p.email === playerEmail);
        if (playerIndex === -1) { showMessage('Player not found in team.', 'warning'); return; }
        if (team.players.length === 1) { showMessage('Cannot remove the last player. Delete the team instead.', 'warning'); return; }

        const playerName = team.players[playerIndex].fullName;
        setLoading(true);
        try {
            const updatedPlayers = team.players.filter((_, idx) => idx !== playerIndex);
            const response = await fetch(`${API_URL}/api/teams/${teamId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sport: team.sport, players: updatedPlayers })
            });
            if (response.ok) { showMessage(`${playerName} removed from roster.`, 'success'); await fetchTeams(); }
            else showMessage('Error removing player', 'danger');
        } catch (error) { showMessage('Error removing player: ' + error.message, 'danger'); }
        finally { setLoading(false); }
    };

    const deleteTeam = async (teamId) => {
        if (!window.confirm('Delete this entire team? This action cannot be undone.')) return;
        const team = teams.find(t => t.id === teamId);
        if (!team) { showMessage('Team not found.', 'warning'); return; }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/teams/${teamId}`, { method: 'DELETE' });
            if (response.ok) { showMessage(`Team "${team.teamName}" deleted successfully.`, 'success'); await fetchTeams(); }
            else showMessage('Error deleting team', 'danger');
        } catch (error) { showMessage('Error deleting team: ' + error.message, 'danger'); }
        finally { setLoading(false); }
    };

    const formatDate = (isoString) => {
        try { const d = new Date(isoString); return d.toLocaleDateString() + ' ' + d.toLocaleTimeString(); }
        catch { return isoString; }
    };

    const renderTeamRoster = (team) => team.players.map((teamPlayer, idx) => {
        const playerData = allPlayers.find(p => p.email === teamPlayer.email) || { fullName: teamPlayer.fullName, email: teamPlayer.email, sports: [team.sport], sportPositions: {} };
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
                    <button className="btn btn-sm btn-danger" onClick={() => removePlayerFromTeam(team.id, teamPlayer.email)} disabled={loading}>Remove</button>
                </div>
            </div>
        );
    });

    if (teams.length === 0) return (
        <div>
            <header className="page-header"><div className="container"><h1>Team Management</h1><p>View and manage all teams.</p></div></header>
            <main className="container mt-5"><div className="alert alert-info">No teams created yet. <a href="/team-builder">Create a team</a></div></main>
        </div>
    );

    return (
        <div>
            <header className="page-header"><div className="container"><h1>Team Management</h1><p>View and manage all teams.</p></div></header>
            <main className="container mt-5">
                {message && (
                    <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
                        {message}<button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                    </div>
                )}
                <div id="teamsList">
                    {teams.map(team => (
                        <div className="card mb-4 shadow-sm" key={team.id}>
                            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="mb-0">{team.teamName}</h5>
                                    <small className="text-muted">{team.sport} | {(team.players?.length) || 0} player(s) | Created: {formatDate(team.createdAt)}</small>
                                </div>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteTeam(team.id)} disabled={loading}>Delete Team</button>
                            </div>
                            <div className="card-body"><h6 className="mb-3">Roster</h6>{renderTeamRoster(team)}</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default TeamsList;
