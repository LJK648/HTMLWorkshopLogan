const PLAYERS_STORAGE_KEY = 'vernball_players';
const TEAMS_STORAGE_KEY = 'vernball_teams';
let allPlayers = [];
let roster = [];
let currentTeamSport = 'all';

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

function getPlayerAssignedSport(player) {
    const sports = getPlayerSports(player);
    return sports.length ? sports[0] : 'Unknown';
}

function getRosterSport() {
    if (!roster.length) return null;
    return roster[0].sport || getPlayerAssignedSport(roster[0]);
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

function getMaxTeamsForPlayer(player) {
    const sports = getPlayerSports(player);
    // Allow one team slot for each registered sport (max 4 sports).
    return Math.max(1, Math.min(sports.length, 4));
}

function showMessage(message, type = 'danger') {
    const alert = $(
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`
    );
    $('#teamErrors').html(alert);
}

function renderPlayerPool(filterText = '') {
    const container = $('#teamBuilderList');
    container.empty();

    const search = filterText.toLowerCase();
    const selectedSport = $('#teamSportFilter').val() || 'all';

    const filtered = allPlayers.filter(player => {
        const sports = getPlayerSports(player);
        const sportsText = sports.join(' ').toLowerCase();
        const matchSearch = !search ||
            player.fullName.toLowerCase().includes(search) ||
            sportsText.includes(search) ||
            player.position.toLowerCase().includes(search) ||
            player.email.toLowerCase().includes(search);

        const matchSport = selectedSport === 'all' || sports.includes(selectedSport);

        return matchSearch && matchSport;
    });

    if (!filtered.length) {
        container.append('<div class="alert alert-secondary">No players match your search and/or sport filter.</div>');
        return;
    }

    const rosterSport = getRosterSport();

    filtered.forEach(player => {
        const playerEmail = player.email;
        const teamCount = countTeamsForPlayer(playerEmail);
        const maxTeams = getMaxTeamsForPlayer(player);
        const availableSlots = Math.max(0, maxTeams - teamCount);
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

        if (!disabled && currentTeamSport !== 'all' && rosterSport === null) {
            // If a sport filter is selected, enforce it as the team sport for first add.
            if (!playerSports.includes(currentTeamSport)) {
                disabled = true;
                reasonText = ' (Not registered for selected sport)';
            }
        }

        const sportList = playerSports.join(', ') || 'None';
        
        let positionText = '';
        if (rosterSport && rosterSport !== 'all' && playerSports.includes(rosterSport)) {
            positionText = getPlayerPositionForSport(player, rosterSport);
        } else if (playerSports.length === 1) {
            positionText = getPlayerPositionForSport(player, playerSports[0]);
        } else if (playerSports.length > 0) {
            positionText = playerSports.map(s => getPlayerPositionForSport(player, s)).join(' | ');
        } else {
            positionText = 'N/A';
        }

        let buttonTitle = '';
        if (disabled) {
            if (inRoster) {
                buttonTitle = 'title="Already in this roster"';
            } else if (teamCount >= maxTeams) {
                buttonTitle = `title="${player.fullName} has reached max team slots (${maxTeams})"`;
            } else if (reasonText.includes('Not registered')) {
                buttonTitle = `title="${player.fullName} is not registered for the required sport"`;
            }
        }

        const card = $(
            `<div class="card mb-2">
                <div class="card-body d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title mb-1">${escapeHtml(player.fullName)}${reasonText}</h5>
                        <p class="card-text mb-1">Sports: ${escapeHtml(sportList)} | Position(s): ${escapeHtml(positionText)}</p>
                        <p class="card-text mb-1">Email: ${escapeHtml(player.email)}</p>
                        <p class="card-text text-muted mb-0">Available team slots: ${availableSlots}/${maxTeams}</p>
                    </div>
                    <button class="btn btn-sm btn-primary add-to-roster" data-email="${escapeHtml(playerEmail)}" ${disabled ? 'disabled' : ''} ${buttonTitle}>Add to Roster</button>
                </div>
            </div>`
        );

        container.append(card);
    });
}

function renderRoster() {
    const container = $('#rosterList');
    container.empty();

    if (!roster.length) {
        container.append('<div class="alert alert-info">Roster is empty. Add players from the left list.</div>');
        return;
    }

    const filterSport = $('#rosterSportFilter').val() || 'all';
    const rosterSport = getRosterSport();

    if (rosterSport) {
        container.append(`<div class="alert alert-light d-flex justify-content-between align-items-center">
            <span>Team Sport: <strong>${escapeHtml(rosterSport)}</strong></span>
            <span class="badge bg-primary">${roster.length} player${roster.length !== 1 ? 's' : ''}</span>
        </div>`);
    } else {
        container.append(`<div class="alert alert-light d-flex justify-content-between align-items-center">
            <span>No sport selected yet</span>
            <span class="badge bg-primary">${roster.length} player${roster.length !== 1 ? 's' : ''}</span>
        </div>`);
    }

    roster
        .filter(player => filterSport === 'all' || getPlayerSports(player).includes(filterSport))
        .forEach((player, index) => {
            const playerSport = player.sport || getPlayerAssignedSport(player);
            const playerPosition = getPlayerPositionForSport(player, playerSport);
            const row = $(
                `<div class="card mb-2">
                    <div class="card-body d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${escapeHtml(player.fullName)}</strong>
                            <p class="mb-0">${escapeHtml(playerSport)} &#8226; ${escapeHtml(playerPosition)}</p>
                        </div>
                        <button class="btn btn-sm btn-danger remove-from-roster" data-email="${escapeHtml(player.email)}">Remove</button>
                    </div>
                </div>`
            );
            container.append(row);
        });
}

function escapeHtml(text) {
    return $('<div>').text(text).html();
}

function addPlayerToRoster(email) {
    const player = allPlayers.find(p => p.email === email);
    if (!player) {
        showMessage('Player not found.', 'warning');
        return;
    }

    if (roster.some(p => p.email === email)) {
        showMessage('Player already in roster.', 'warning');
        return;
    }

    const onTeamCount = countTeamsForPlayer(email);
    const maxTeams = getMaxTeamsForPlayer(player);
    if (onTeamCount >= maxTeams) {
        showMessage(`${player.fullName} is already on ${maxTeams} team(s), cannot add to another.`, 'danger');
        return;
    }

    const selectedSport = $('#teamSportFilter').val() || 'all';
    const playerSports = getPlayerSports(player);
    const rosterSport = getRosterSport();

    let assignedSport = rosterSport || 'all';

    if (selectedSport !== 'all') {
        assignedSport = selectedSport;
    } else if (rosterSport && rosterSport !== 'all') {
        assignedSport = rosterSport;
    } else if (!rosterSport) {
        assignedSport = playerSports[0] || 'Unknown';
    }

    if (!playerSports.includes(assignedSport)) {
        showMessage(`${player.fullName} is not registered for ${assignedSport} and cannot be added to this roster.`, 'danger');
        return;
    }

    if (rosterSport && rosterSport !== assignedSport) {
        showMessage(`All players must be in the same sport for one team (currently ${rosterSport}).`, 'danger');
        return;
    }

    roster.push({
        ...player,
        sport: assignedSport
    });

    currentTeamSport = assignedSport;

    renderRoster();
    renderPlayerPool($('#teamPlayerSearch').val().trim());
    showMessage(`✓ ${player.fullName} added to roster!`, 'success');
}

function removePlayerFromRoster(email) {
    const player = roster.find(p => p.email === email);
    roster = roster.filter(p => p.email !== email);
    renderRoster();
    renderPlayerPool($('#teamPlayerSearch').val().trim());
    if (player) {
        showMessage(`✓ ${player.fullName} removed from roster`, 'info');
    }
}

function clearRoster() {
    roster = [];
    currentTeamSport = 'all';
    $('#teamSportFilter').val('all');
    renderRoster();
    renderPlayerPool($('#teamPlayerSearch').val().trim());
    $('#teamErrors').empty();
}

function submitTeam() {
    $('#teamErrors').empty();

    const teamName = $('#teamName').val().trim();
    if (!teamName) {
        showMessage('Team name is required.', 'danger');
        return;
    }

    if (!roster.length) {
        showMessage('Add at least one player to the roster before saving.', 'danger');
        return;
    }

    const teams = loadTeams();
    const rosterSport = getRosterSport();

    if (!rosterSport || rosterSport === 'all') {
        showMessage('Could not determine the team sport. Ensure roster contains at least one player.', 'danger');
        return;
    }

    for (const player of roster) {
        const currentCount = countTeamsForPlayer(player.email);
        const maxTeams = getMaxTeamsForPlayer(player);
        if (currentCount >= maxTeams) {
            showMessage(`${player.fullName} cannot be added: already on ${maxTeams} team(s).`, 'danger');
            return;
        }

        if (!getPlayerSports(player).includes(rosterSport)) {
            showMessage(`${player.fullName} is not registered for ${rosterSport}.`, 'danger');
            return;
        }
    }

    const newTeam = {
        teamId: Date.now(),
        teamName,
        sport: rosterSport,
        createdAt: new Date().toISOString(),
        players: roster.map(p => ({ 
            fullName: p.fullName, 
            email: p.email, 
            sport: p.sport, 
            position: getPlayerPositionForSport(p, rosterSport)
        }))
    };

    teams.push(newTeam);
    saveTeams(teams);

    postTeamToApi(newTeam);

    showMessage(`Team "${escapeHtml(teamName)}" saved successfully!`, 'success');
    $('#teamName').val('');
    clearRoster();
}

function postTeamToApi(team) {
    const payload = { team };
    console.log('Placeholder AJAX send to future REST API:', payload);

    $.ajax({
        url: 'https://jsonplaceholder.typicode.com/posts',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        timeout: 5000
    })
    .done(response => {
        console.log('Placeholder API response:', response);
    })
    .fail((jqXHR, textStatus, errorThrown) => {
        console.warn('Placeholder API request failed (expected no real backend):', textStatus, errorThrown);
    });
}

// ====== Add to Existing Team Functions ======

let selectedEditTeamId = null;

function showAddToTeamMessage(message, type = 'danger') {
    const alert = $(
        `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`
    );
    $('#addToTeamErrors').html(alert);
}

function loadExistingTeams() {
    const teams = loadTeams();
    const select = $('#existingTeamSelect');
    select.find('option:not(:first)').remove();

    teams.forEach(team => {
        const option = $(`<option value="${team.teamId}">${escapeHtml(team.teamName)} (${escapeHtml(team.sport)})</option>`);
        select.append(option);
    });
}

function renderSelectedTeamInfo(teamId) {
    const teams = loadTeams();
    const team = teams.find(t => t.teamId === teamId);

    if (!team) return;

    const playerCount = (team.players && team.players.length) || 0;
    const info = `
        <strong>${escapeHtml(team.teamName)}</strong><br>
        <small>Sport: ${escapeHtml(team.sport)} | Players: ${playerCount}</small>
    `;
    $('#selectedTeamInfo').html(info).show();
}

function renderAddToTeamPlayerList(filterText = '', teamId = null) {
    const container = $('#addToTeamPlayerList');
    container.empty();
    
    console.log('renderAddToTeamPlayerList called with teamId:', teamId, 'filterText:', filterText);

    if (!teamId) {
        console.log('No teamId provided, showing select message');
        container.append(`<div class="alert alert-warning" role="alert">
            <strong>👇 Select a Team First</strong><br>
            Choose a team from the "Existing Teams" dropdown on the left to see available players here.
        </div>`);
        return;
    }

    const teams = loadTeams();
    const team = teams.find(t => t.teamId === teamId);

    if (!team) {
        console.log('Team not found with ID:', teamId);
        container.append('<div class="alert alert-warning">Team not found.</div>');
        return;
    }

    const teamPlayers = team.players || [];
    const teamPlayerEmails = teamPlayers.map(p => p.email);
    const search = filterText.toLowerCase();
    const selectedSport = $('#addToTeamSportFilter').val() || 'all';

    console.log('Team found:', team.teamName, '| Team sport:', team.sport, '| Selected sport filter:', selectedSport);
    console.log('All players count:', allPlayers.length);

    const filtered = allPlayers.filter(player => {
        const sports = getPlayerSports(player);
        const matchSearch = !search ||
            player.fullName.toLowerCase().includes(search) ||
            player.email.toLowerCase().includes(search) ||
            sports.join(' ').toLowerCase().includes(search);

        const matchSport = selectedSport === 'all' || sports.includes(selectedSport);
        const notAlreadyInTeam = !teamPlayerEmails.includes(player.email);
        const hasTeamSport = sports.includes(team.sport);

        return matchSearch && matchSport && notAlreadyInTeam && hasTeamSport;
    });

    console.log('Filtered players count:', filtered.length);

    if (!filtered.length) {
        console.log('No filtered players - showing empty message');
        container.append('<div class="alert alert-secondary">No available players for this team.</div>');
        return;
    }

    filtered.forEach(player => {
        const playerEmail = player.email;
        const teamCount = countTeamsForPlayer(playerEmail);
        const maxTeams = getMaxTeamsForPlayer(player);
        const availableSlots = Math.max(0, maxTeams - teamCount);

        let disabled = teamCount >= maxTeams;
        let reasonText = teamCount >= maxTeams ? ` (Max ${maxTeams} teams reached)` : '';

        let buttonTitle = '';
        if (disabled) {
            buttonTitle = `title="${player.fullName} has reached max team slots (${maxTeams})"`;
        }

        const sportList = getPlayerSports(player).join(', ');
        const playerPosition = getPlayerPositionForSport(player, team.sport);

        const card = $(
            `<div class="card mb-2">
                <div class="card-body d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title mb-1">${escapeHtml(player.fullName)}${reasonText}</h5>
                        <p class="card-text mb-1">Sports: ${escapeHtml(sportList)} | Position (${escapeHtml(team.sport)}): ${escapeHtml(playerPosition)}</p>
                        <p class="card-text mb-1">Email: ${escapeHtml(player.email)}</p>
                        <p class="card-text text-muted mb-0">Available team slots: ${availableSlots}/${maxTeams}</p>
                    </div>
                    <button class="btn btn-sm btn-success add-to-existing-team" data-email="${escapeHtml(playerEmail)}" data-team-id="${teamId}" ${disabled ? 'disabled' : ''} ${buttonTitle}>Add</button>
                </div>
            </div>`
        );

        container.append(card);
    });
}

function addPlayerToExistingTeam(email, teamId) {
    const teams = loadTeams();
    const teamIndex = teams.findIndex(t => t.teamId === teamId);

    if (teamIndex === -1) {
        showAddToTeamMessage('Team not found.', 'warning');
        return;
    }

    const team = teams[teamIndex];
    const player = allPlayers.find(p => p.email === email);

    if (!player) {
        showAddToTeamMessage('Player not found.', 'warning');
        return;
    }

    if (team.players.some(p => p.email === email)) {
        showAddToTeamMessage('Player already in this team.', 'warning');
        return;
    }

    const sports = getPlayerSports(player);
    if (!sports.includes(team.sport)) {
        showAddToTeamMessage(`${player.fullName} is not registered for ${team.sport}.`, 'danger');
        return;
    }

    const maxTeams = getMaxTeamsForPlayer(player);
    const onTeamCount = countTeamsForPlayer(email);
    if (onTeamCount >= maxTeams) {
        showAddToTeamMessage(`${player.fullName} is already on ${maxTeams} team(s), cannot add to another.`, 'danger');
        return;
    }

    team.players.push({
        fullName: player.fullName,
        email: player.email,
        sport: team.sport,
        position: getPlayerPositionForSport(player, team.sport)
    });

    saveTeams(teams);
    showAddToTeamMessage(`${player.fullName} added to ${team.teamName} successfully!`, 'success');
    renderAddToTeamPlayerList($('#addToTeamPlayerSearch').val().trim(), teamId);
    renderSelectedTeamInfo(teamId);
}

$(document).ready(function () {
    allPlayers = loadPlayers();
    renderPlayerPool();
    renderRoster();

    $('#teamPlayerSearch').on('keyup', function () {
        renderPlayerPool($(this).val().trim());
    });

    $('#teamSportFilter').on('change', function () {
        currentTeamSport = $(this).val() || 'all';
        renderPlayerPool($('#teamPlayerSearch').val().trim());
    });

    $('#rosterSportFilter').on('change', function () {
        renderRoster();
    });

    // Add to Existing Team Tab Events
    $('#existingTeamSelect').on('change', function () {
        const teamId = parseInt($(this).val(), 10) || null;
        selectedEditTeamId = teamId;

        if (teamId) {
            renderSelectedTeamInfo(teamId);
            renderAddToTeamPlayerList($('#addToTeamPlayerSearch').val().trim(), teamId);
        } else {
            $('#selectedTeamInfo').hide();
            $('#addToTeamPlayerList').empty();
        }
    });

    $('#addToTeamPlayerSearch').on('keyup', function () {
        renderAddToTeamPlayerList($(this).val().trim(), selectedEditTeamId);
    });

    $('#addToTeamSportFilter').on('change', function () {
        renderAddToTeamPlayerList($('#addToTeamPlayerSearch').val().trim(), selectedEditTeamId);
    });

    $(document).on('click', '.add-to-existing-team', function () {
        const email = $(this).data('email');
        const teamId = parseInt($(this).data('team-id'), 10);
        addPlayerToExistingTeam(email, teamId);
    });

    $(document).on('click', '.add-to-roster', function () {
        const email = $(this).data('email');
        addPlayerToRoster(email);
    });

    $(document).on('click', '.remove-from-roster', function () {
        const email = $(this).data('email');
        removePlayerFromRoster(email);
    });

    $('#saveTeamBtn').on('click', function (event) {
        event.preventDefault();
        submitTeam();
    });

    $('#clearRosterBtn').on('click', function (event) {
        event.preventDefault();
        clearRoster();
    });

    // Handle mode selection dropdown
    $('#modeSelect').on('change', function () {
        const selectedMode = $(this).val();
        
        if (selectedMode === 'create') {
            $('#createTeamPane').show();
            $('#addToTeamPane').hide();
            renderPlayerPool($('#teamPlayerSearch').val().trim());
            renderRoster();
        } else if (selectedMode === 'add') {
            $('#createTeamPane').hide();
            $('#addToTeamPane').show();
            loadExistingTeams();
            // Clear selection and show initial message
            $('#existingTeamSelect').val('');
            $('#selectedTeamInfo').hide();
            selectedEditTeamId = null;
            renderAddToTeamPlayerList('', null);
        }
    });

    // Show create mode on load
    $('#createTeamPane').show();
    $('#addToTeamPane').hide();
});