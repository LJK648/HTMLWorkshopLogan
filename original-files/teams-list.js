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
        position: player.position || '',
        fullName: player.fullName || '',
        email: player.email || ''
    };
}

function getPlayerSports(player) {
    return Array.isArray(player.sports) ? player.sports : [];
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

function getMaxTeamsForPlayer(player) {
    const sports = getPlayerSports(player);
    return Math.max(1, Math.min(sports.length, 3));
}

function countTeamsForPlayer(playerEmail) {
    const teams = loadTeams();
    return teams.reduce((count, team) => {
        if (team.players && Array.isArray(team.players)) {
            const match = team.players.some(p => p.email === playerEmail);
            return count + (match ? 1 : 0);
        }
        return count;
    }, 0);
}

function showMessage(message, type = 'danger') {
    const alert = $(
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`
    );
    $('#teamsErrors').html(alert);
}

function escapeHtml(text) {
    return $('<div>').text(text).html();
}

function formatDate(isoString) {
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
        return isoString;
    }
}

function removePlayerFromTeam(teamId, playerEmail) {
    if (!confirm('Remove this player from the roster?')) return;

    const teams = loadTeams();
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
    team.players.splice(playerIndex, 1);

    if (team.players.length === 0) {
        showMessage('Cannot remove the last player from a team. Delete the team instead.', 'warning');
        team.players.splice(playerIndex, 0, {
            fullName: playerName,
            email: playerEmail,
            sport: team.sport,
            position: ''
        });
        return;
    }

    saveTeams(teams);
    showMessage(`${playerName} removed from roster.`, 'success');
    renderTeams();
}

function deleteTeam(teamId) {
    if (!confirm('Delete this entire team? This action cannot be undone.')) return;

    const teams = loadTeams();
    const teamIndex = teams.findIndex(t => t.teamId === teamId);

    if (teamIndex === -1) {
        showMessage('Team not found.', 'warning');
        return;
    }

    const teamName = teams[teamIndex].teamName;
    teams.splice(teamIndex, 1);
    saveTeams(teams);
    showMessage(`Team "${escapeHtml(teamName)}" deleted successfully.`, 'success');
    renderTeams();
}

function renderTeamRoster(team, allPlayers) {
    const roster = team.players.map(teamPlayer => {
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

        return `
            <div class="card mb-2">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${escapeHtml(teamPlayer.fullName)}</strong>
                        <p class="mb-1 text-muted">${escapeHtml(teamPlayer.sport)} &#8226; ${escapeHtml(playerPosition)}</p>
                        <p class="mb-0 text-muted"><small>${escapeHtml(teamPlayer.email)}</small></p>
                        <p class="mb-0 text-muted"><small>Available team slots: ${availableSlots}/${maxTeams}</small></p>
                    </div>
                    <button class="btn btn-sm btn-danger delete-player" data-team-id="${team.teamId}" data-email="${escapeHtml(teamPlayer.email)}">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    return roster;
}

function renderTeams() {
    const container = $('#teamsList');
    container.empty();

    const teams = loadTeams();
    const allPlayers = loadPlayers();

    if (!teams.length) {
        container.append('<div class="alert alert-info">No teams created yet. <a href="team-builder.html">Create a team</a></div>');
        return;
    }

    teams.forEach(team => {
        const createdDate = formatDate(team.createdAt);
        const playerCount = (team.players && team.players.length) || 0;
        const rosterHtml = renderTeamRoster(team, allPlayers);

        const card = `
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-0">${escapeHtml(team.teamName)}</h5>
                        <small class="text-muted">${escapeHtml(team.sport)} | ${playerCount} player(s) | Created: ${createdDate}</small>
                    </div>
                    <button class="btn btn-sm btn-danger delete-team" data-team-id="${team.teamId}">Delete Team</button>
                </div>
                <div class="card-body">
                    <h6 class="mb-3">Roster</h6>
                    ${rosterHtml}
                </div>
            </div>
        `;
        container.append(card);
    });
}

$(document).ready(function () {
    renderTeams();

    $(document).on('click', '.delete-player', function () {
        const teamId = parseInt($(this).data('team-id'), 10);
        const email = $(this).data('email');
        removePlayerFromTeam(teamId, email);
    });

    $(document).on('click', '.delete-team', function () {
        const teamId = parseInt($(this).data('team-id'), 10);
        deleteTeam(teamId);
    });
});