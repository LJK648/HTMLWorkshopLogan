import React, { useEffect, useMemo, useState } from 'react';

const PLAYERS_STORAGE_KEY = 'vernball_players';
const TEAMS_STORAGE_KEY = 'vernball_teams';
const SPORTS = ['Basketball', 'Football', 'Soccer', 'Baseball'];

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

function getPlayerSports(player) {
  return Array.isArray(player.sports) ? player.sports : [];
}

function getPlayerPositionForSport(player, sport) {
  const sportPositions = player.sportPositions || {};
  return sportPositions[sport] || player.position || 'N/A';
}

function getMaxTeamsForPlayer(player) {
  const sports = getPlayerSports(player);
  return Math.max(1, Math.min(sports.length || 1, 4));
}

function countTeamsForPlayer(email, teams) {
  return teams.reduce((count, team) => {
    if (team.players && Array.isArray(team.players)) {
      return count + (team.players.some(p => p.email === email) ? 1 : 0);
    }
    return count;
  }, 0);
}

const TeamBuilderForm = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [mode, setMode] = useState('create');
  const [teamName, setTeamName] = useState('');
  const [roster, setRoster] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [rosterFilter, setRosterFilter] = useState('all');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [addSearchText, setAddSearchText] = useState('');
  const [addSportFilter, setAddSportFilter] = useState('all');
  const [message, setMessage] = useState(null);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    setPlayers(loadPlayers());
    setTeams(loadTeams());
  }, []);

  const selectedTeam = useMemo(() => {
    if (!selectedTeamId) return null;
    return teams.find(team => team.teamId === Number(selectedTeamId)) || null;
  }, [selectedTeamId, teams]);

  const rosterSport = useMemo(() => {
    if (!roster.length) return null;
    return roster[0].sport || getPlayerSports(roster[0])[0] || null;
  }, [roster]);

  const filteredPlayers = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return players.filter(player => {
      const sports = getPlayerSports(player);
      const sportsText = sports.join(' ').toLowerCase();
      const matchSearch = !search ||
        player.fullName.toLowerCase().includes(search) ||
        sportsText.includes(search) ||
        player.email.toLowerCase().includes(search);
      const matchSport = sportFilter === 'all' || sports.includes(sportFilter);
      const inRoster = roster.some(r => r.email === player.email);
      const availableSlots = Math.max(0, getMaxTeamsForPlayer(player) - countTeamsForPlayer(player.email, teams));
      const matchesRosterSport = !rosterSport || sports.includes(rosterSport);

      return matchSearch && matchSport && !inRoster && availableSlots > 0 && matchesRosterSport;
    });
  }, [players, searchText, sportFilter, roster, rosterSport, teams]);

  const filteredAddPlayers = useMemo(() => {
    const search = addSearchText.trim().toLowerCase();
    if (!selectedTeam) return [];

    return players.filter(player => {
      const sports = getPlayerSports(player);
      const sportsText = sports.join(' ').toLowerCase();
      const matchSearch = !search ||
        player.fullName.toLowerCase().includes(search) ||
        sportsText.includes(search) ||
        player.email.toLowerCase().includes(search);
      const matchSport = addSportFilter === 'all' || sports.includes(addSportFilter);
      const alreadyOnTeam = selectedTeam.players.some(p => p.email === player.email);
      const availableSlots = Math.max(0, getMaxTeamsForPlayer(player) - countTeamsForPlayer(player.email, teams));
      return matchSearch && matchSport && !alreadyOnTeam && availableSlots > 0 && sports.includes(selectedTeam.sport);
    });
  }, [players, addSearchText, addSportFilter, selectedTeam, teams]);

  const showAlert = (text, type = 'danger') => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), 5000);
  };

  const addPlayerToRoster = (player) => {
    if (roster.some(item => item.email === player.email)) {
      showAlert('Player already in the roster.', 'warning');
      return;
    }

    const slots = Math.max(0, getMaxTeamsForPlayer(player) - countTeamsForPlayer(player.email, teams));
    if (slots <= 0) {
      showAlert(`${player.fullName} has reached their team maximum.`, 'danger');
      return;
    }

    if (roster.length && rosterSport && !getPlayerSports(player).includes(rosterSport)) {
      showAlert(`Player must be registered for ${rosterSport} to join this roster.`, 'warning');
      return;
    }

    const normalized = { ...player, sport: roster.length ? rosterSport : (getPlayerSports(player)[0] || 'Unknown') };
    setRoster(prev => [...prev, normalized]);
  };

  const removePlayerFromRoster = (email) => {
    setRoster(prev => prev.filter(player => player.email !== email));
  };

  const clearRoster = () => {
    setRoster([]);
    setTeamName('');
    showAlert('Roster cleared.', 'success');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      showAlert('Please enter a team name.', 'warning');
      return;
    }

    if (!roster.length) {
      showAlert('Add at least one player before saving the team.', 'warning');
      return;
    }

    const team = {
      teamId: Date.now(),
      teamName: teamName.trim(),
      sport: rosterSport || 'Unknown',
      createdAt: new Date().toISOString(),
      players: roster.map(player => ({
        fullName: player.fullName,
        email: player.email,
        sport: rosterSport || getPlayerSports(player)[0] || 'Unknown',
        position: getPlayerPositionForSport(player, rosterSport || getPlayerSports(player)[0] || 'Unknown')
      }))
    };

    // Log the team data as JSON
    console.log('Team Builder Form Submission:', JSON.stringify(team, null, 2));

    // Perform AJAX fetch call
    fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    })
      .then(response => response.json())
      .then(data => {
        console.log('Mock API Response:', JSON.stringify(data, null, 2));
        setResponse(JSON.stringify(data, null, 2));
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setResponse('Error: ' + error.message);
      });

    const updatedTeams = [...teams, team];
    saveTeams(updatedTeams);
    setTeams(updatedTeams);
    clearRoster();
    showAlert(`Team "${team.teamName}" saved successfully.`, 'success');
  };

  const addToExistingTeam = (player) => {
    if (!selectedTeam) {
      showAlert('Choose a team to add players.', 'warning');
      return;
    }

    const alreadyOnTeam = selectedTeam.players.some(p => p.email === player.email);
    if (alreadyOnTeam) {
      showAlert('Player is already on this team.', 'warning');
      return;
    }

    const slots = Math.max(0, getMaxTeamsForPlayer(player) - countTeamsForPlayer(player.email, teams));
    if (slots <= 0) {
      showAlert(`${player.fullName} has reached their team maximum.`, 'danger');
      return;
    }

    if (!getPlayerSports(player).includes(selectedTeam.sport)) {
      showAlert(`Player must be registered for ${selectedTeam.sport}.`, 'warning');
      return;
    }

    const updatedTeams = teams.map(team => {
      if (team.teamId !== selectedTeam.teamId) return team;
      return {
        ...team,
        players: [...team.players, {
          fullName: player.fullName,
          email: player.email,
          sport: selectedTeam.sport,
          position: getPlayerPositionForSport(player, selectedTeam.sport)
        }]
      };
    });

    saveTeams(updatedTeams);
    setTeams(updatedTeams);
    showAlert(`${player.fullName} added to ${selectedTeam.teamName}.`, 'success');
  };

  const createPlayerCard = (player, onAdd) => {
    const availableSlots = Math.max(0, getMaxTeamsForPlayer(player) - countTeamsForPlayer(player.email, teams));
    const sportList = getPlayerSports(player).join(', ') || 'None';
    const positionList = getPlayerSports(player)
      .map(s => `${s}: ${getPlayerPositionForSport(player, s)}`)
      .join(' | ');
    return (
      <div key={player.email} className="card mb-2">
        <div className="card-body d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title mb-1">{player.fullName}</h5>
            <p className="card-text mb-1">Sports: {sportList}</p>
            <p className="card-text mb-1">Positions: {positionList}</p>
            <p className="card-text mb-0">Email: {player.email}</p>
            <p className="text-muted small mb-0">Available team slots: {availableSlots}/{getMaxTeamsForPlayer(player)}</p>
          </div>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => onAdd(player)}>
            Add
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1>Team Builder</h1>
          <p>Create new rosters or add players to existing teams.</p>
        </div>
      </div>
      {message && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="modeSelect" className="form-label fw-semibold">Select Mode:</label>
        <select id="modeSelect" className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="create">Create New Team</option>
          <option value="add">Add to Existing Team</option>
        </select>
      </div>

      {mode === 'create' ? (
        <div className="row">
          <div className="col-lg-6">
            <div className="card mb-3">
              <div className="card-body">
                <h3>Available Players</h3>
                <div className="mb-3">
                  <label htmlFor="teamPlayerSearch" className="form-label">Search Players</label>
                  <input
                    id="teamPlayerSearch"
                    className="form-control"
                    type="search"
                    placeholder="Search by name, sport, or email"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="teamSportFilter" className="form-label">Filter by Sport</label>
                  <select
                    id="teamSportFilter"
                    className="form-select"
                    value={sportFilter}
                    onChange={(e) => setSportFilter(e.target.value)}
                  >
                    <option value="all">All Sports</option>
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
                <div id="teamBuilderList" className="overflow-auto" style={{ maxHeight: '520px' }}>
                  {filteredPlayers.length ? filteredPlayers.map(player => createPlayerCard(player, addPlayerToRoster)) : (
                    <div className="alert alert-secondary">No players match your search or filters.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card mb-3">
              <div className="card-body">
                <h3>Roster</h3>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="teamName" className="form-label">Team Name</label>
                    <input
                      id="teamName"
                      className="form-control"
                      type="text"
                      placeholder="Enter team name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="rosterSportFilter" className="form-label">Roster Sport Filter</label>
                    <select
                      id="rosterSportFilter"
                      className="form-select"
                      value={rosterFilter}
                      onChange={(e) => setRosterFilter(e.target.value)}
                    >
                      <option value="all">All roster players</option>
                      {SPORTS.map(sport => (
                        <option key={sport} value={sport}>{sport}</option>
                      ))}
                    </select>
                  </div>
                  {roster.length > 0 && (
                    <div className="alert alert-light">
                      Team sport: <strong>{rosterSport || 'Pending selection'}</strong>
                    </div>
                  )}
                  <div id="rosterList" className="overflow-auto" style={{ maxHeight: '360px' }}>
                    {roster.length ? roster
                      .filter(player => rosterFilter === 'all' || getPlayerSports(player).includes(rosterFilter))
                      .map(player => (
                        <div key={player.email} className="card mb-2">
                          <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{player.fullName}</strong>
                              <p className="mb-0">{player.sport} • {getPlayerPositionForSport(player, player.sport)}</p>
                              <p className="mb-0 text-muted small">{player.email}</p>
                            </div>
                            <button className="btn btn-sm btn-danger" type="button" onClick={() => removePlayerFromRoster(player.email)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="alert alert-info">Roster is empty. Add players from the left list.</div>
                      )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button type="submit" className="btn btn-primary">Save Team</button>
                    <button type="button" className="btn btn-secondary" onClick={clearRoster}>Clear Roster</button>
                  </div>
                </form>
                {response && <pre>{response}</pre>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-lg-6">
            <div className="card mb-3">
              <div className="card-body">
                <h3>Existing Teams</h3>
                <div className="mb-3">
                  <label htmlFor="existingTeamSelect" className="form-label">Select Team to Edit</label>
                  <select
                    id="existingTeamSelect"
                    className="form-select"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                  >
                    <option value="">-- Choose a team --</option>
                    {teams.map(team => (
                      <option key={team.teamId} value={team.teamId}>{team.teamName}</option>
                    ))}
                  </select>
                </div>
                {selectedTeam ? (
                  <div className="alert alert-light">
                    <div><strong>{selectedTeam.teamName}</strong></div>
                    <div>Sport: {selectedTeam.sport}</div>
                    <div>Players: {selectedTeam.players.length}</div>
                  </div>
                ) : (
                  <div className="alert alert-secondary">Select a team to add players.</div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card mb-3">
              <div className="card-body">
                <h3>Add Players to Team</h3>
                <div className="mb-3">
                  <label htmlFor="addToTeamPlayerSearch" className="form-label">Search Available Players</label>
                  <input
                    id="addToTeamPlayerSearch"
                    className="form-control"
                    type="search"
                    placeholder="Search by name, sport, or email"
                    value={addSearchText}
                    onChange={(e) => setAddSearchText(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="addToTeamSportFilter" className="form-label">Filter by Sport</label>
                  <select
                    id="addToTeamSportFilter"
                    className="form-select"
                    value={addSportFilter}
                    onChange={(e) => setAddSportFilter(e.target.value)}
                  >
                    <option value="all">All Sports</option>
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
                <div id="addToTeamPlayerList" className="overflow-auto" style={{ maxHeight: '440px' }}>
                  {selectedTeam ? (
                    filteredAddPlayers.length ? filteredAddPlayers.map(player => createPlayerCard(player, addToExistingTeam)) : (
                      <div className="alert alert-secondary">No available players match the filter.</div>
                    )
                  ) : (
                    <div className="alert alert-info">Choose a team first.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamBuilderForm;
