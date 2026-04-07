import React, { useEffect, useState } from 'react';

const PLAYERS_STORAGE_KEY = 'vernball_players';
const TEAMS_STORAGE_KEY = 'vernball_teams';

function normalizePlayer(player) {
  const sports = Array.isArray(player.sports)
    ? player.sports.filter(Boolean)
    : player.sport
      ? [player.sport]
      : [];

  return {
    ...player,
    sports: sports.slice(0, 3),
    sportPositions: player.sportPositions || {},
    fullName: player.fullName || '',
    email: player.email || ''
  };
}

function getPlayerPositionForSport(player, sport) {
  const sportPositions = player.sportPositions || {};
  return sportPositions[sport] || player.position || 'N/A';
}

function loadPlayers() {
  const json = localStorage.getItem(PLAYERS_STORAGE_KEY);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizePlayer);
  } catch (e) {
    console.error('Could not parse players', e);
    return [];
  }
}

function loadTeams() {
  const json = localStorage.getItem(TEAMS_STORAGE_KEY);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Could not parse teams', e);
    return [];
  }
}

function saveTeams(teams) {
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
}

function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  } catch {
    return isoString;
  }
}

const TeamsList = () => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setTeams(loadTeams());
    setPlayers(loadPlayers());
  }, []);

  const showAlert = (text, type = 'danger') => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), 5000);
  };

  const removePlayerFromTeam = (teamId, playerEmail) => {
    if (!window.confirm('Remove this player from the roster?')) return;

    const updatedTeams = teams.map(team => {
      if (team.teamId !== teamId) return team;
      if (!team.players || team.players.length <= 1) return team;
      return {
        ...team,
        players: team.players.filter(player => player.email !== playerEmail)
      };
    });

    const targetTeam = teams.find(team => team.teamId === teamId);
    if (targetTeam && targetTeam.players.length <= 1) {
      showAlert('Cannot remove the last player from a team. Delete the team instead.', 'warning');
      return;
    }

    setTeams(updatedTeams);
    saveTeams(updatedTeams);
    showAlert('Player removed from team.', 'success');
  };

  const deleteTeam = (teamId) => {
    if (!window.confirm('Delete this entire team? This action cannot be undone.')) return;

    const updatedTeams = teams.filter(team => team.teamId !== teamId);
    setTeams(updatedTeams);
    saveTeams(updatedTeams);
    showAlert('Team deleted successfully.', 'success');
  };

  const getPlayerData = (playerEmail) => {
    return players.find(player => player.email === playerEmail);
  };

  return (
    <div className="container mt-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1>Saved Teams</h1>
          <p>Manage and view all created rosters.</p>
        </div>
      </div>
      {message && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      <div id="teamsList">
        {teams.length === 0 ? (
          <div className="alert alert-info">No teams created yet. Create a team from the Team Builder page.</div>
        ) : teams.map(team => (
          <div key={team.teamId} className="card mb-4 shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{team.teamName}</h5>
                <small className="text-muted">{team.sport} | {team.players.length} player{team.players.length !== 1 ? 's' : ''} | Created: {formatDate(team.createdAt)}</small>
              </div>
              <button className="btn btn-sm btn-danger" type="button" onClick={() => deleteTeam(team.teamId)}>
                Delete Team
              </button>
            </div>
            <div className="card-body">
              <h6 className="mb-3">Roster</h6>
              {team.players.map(player => {
                const playerData = getPlayerData(player.email) || player;
                const position = getPlayerPositionForSport(playerData, team.sport) || player.position || 'N/A';
                return (
                  <div key={player.email} className="card mb-2">
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{player.fullName}</strong>
                        <p className="mb-1 text-muted">{team.sport} • {position}</p>
                        <p className="mb-0 text-muted small">{player.email}</p>
                      </div>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => removePlayerFromTeam(team.teamId, player.email)}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsList;
