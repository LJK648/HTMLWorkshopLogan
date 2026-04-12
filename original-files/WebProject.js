// JavaScript code
const STORAGE_KEY = "vernball_players";

// Sport to positions mapping
const SPORT_POSITIONS = {
    Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    Football: ["Quarterback", "Running Back", "Wide Receiver", "Tight End", "Offensive Lineman", "Defensive End", "Linebacker", "Defensive Back"],
    Soccer: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    Baseball: ["Pitcher", "Catcher", "Infielder", "Outfielder"]
};

function loadPlayers() {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    try {
        const saved = JSON.parse(json);
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error('Error reading players from localStorage', error);
        return [];
    }
}

function savePlayers(players) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

function updatePositionOptions() {
    const sportSelect = document.getElementById('sports');
    const selectedSports = Array.from(sportSelect.selectedOptions).map(o => o.value).filter(v => v);
    const container = document.getElementById('sportPositions');
    const mainContainer = document.getElementById('sportPositionsContainer');

    if (!selectedSports.length) {
        mainContainer.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    mainContainer.style.display = 'block';
    container.innerHTML = '';

    selectedSports.forEach(sport => {
        const positions = SPORT_POSITIONS[sport] || [];
        const sportDiv = document.createElement('div');
        sportDiv.className = 'mb-3';
        sportDiv.innerHTML = `
            <label for="position_${sport}" class="form-label">${sport}</label>
            <select class="form-select sport-position-select" id="position_${sport}" data-sport="${sport}" required>
                <option selected>-- Select Position --</option>
                ${positions.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
        `;
        container.appendChild(sportDiv);
    });
}

function displayPlayers(players) {
    const container = document.getElementById('playersContainer');
    container.innerHTML = '';

    if (!players.length) {
        container.innerHTML = '<div class="alert alert-info">No registered players yet.</div>';
        return;
    }

    players.forEach((player, index) => {
        const sports = Array.isArray(player.sports) ? player.sports : [player.sport].filter(Boolean);
        const sportsText = sports.length ? sports.join(', ') : 'No sports';
        const sportPositions = player.sportPositions || {};
        
        let positionsText = '';
        if (sports.length > 0) {
            positionsText = sports.map(sport => {
                const pos = sportPositions[sport] || 'N/A';
                return `${sport}: ${pos}`;
            }).join(' | ');
        } else {
            positionsText = 'No positions';
        }

        const card = document.createElement('div');
        card.className = 'card mb-2';

        card.innerHTML = `
            <div class="card-body d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="card-title mb-1">${escapeHtml(player.fullName)}</h5>
                    <p class="card-text mb-1">Email: ${escapeHtml(player.email)}</p>
                    <p class="card-text mb-1">Sports: ${escapeHtml(sportsText)}</p>
                    <p class="card-text mb-0">Positions: ${escapeHtml(positionsText)}</p>
                </div>
                <button class="btn btn-danger btn-sm" data-index="${index}">Delete</button>
            </div>
        `;

        card.querySelector('button').addEventListener('click', () => {
            deletePlayer(index);
        });

        container.appendChild(card);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getFormData(form) {
    const formData = new FormData(form);
    const sports = Array.from(formData.getAll('sports'))
        .map(s => s.trim())
        .filter(Boolean);

    const sportPositions = {};
    sports.forEach(sport => {
        const posSelect = document.getElementById(`position_${sport}`);
        if (posSelect) {
            sportPositions[sport] = posSelect.value.trim();
        }
    });

    return {
        fullName: formData.get('fullName').trim(),
        email: formData.get('email').trim(),
        sports: sports.slice(0, 3),
        sportPositions: sportPositions
    };
}

function clearForm(form) {
    form.reset();
    document.getElementById('sportPositionsContainer').style.display = 'none';
    document.getElementById('sportPositions').innerHTML = '';
}

function deletePlayer(index) {
    const players = loadPlayers();
    if (index < 0 || index >= players.length) return;
    if (!confirm(`Delete player ${players[index].fullName}?`)) return;

    players.splice(index, 1);
    savePlayers(players);
    displayPlayers(players);
}

function handleSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('registrationForm');
    const player = getFormData(form);

    if (!player.fullName || !player.email || !player.sports || !player.sports.length) {
        alert('Please fill in all fields and select at least one sport.');
        return;
    }

    if (player.sports.length > 4) {
        alert('You can select up to 4 sports.');
        return;
    }

    // Validate that each sport has a position
    for (const sport of player.sports) {
        if (!player.sportPositions[sport] || player.sportPositions[sport] === '-- Select Position --') {
            alert(`Please select a position for ${sport}.`);
            return;
        }
    }

    const players = loadPlayers();
    players.push(player);
    savePlayers(players);

    displayPlayers(players);
    clearForm(form);
    alert('Player registered!');
}

function filterPlayers(query) {
    const players = loadPlayers();
    const searchType = document.getElementById('searchType')?.value || 'all';
    
    if (!query) {
        displayPlayers(players);
        return;
    }

    const text = query.toLowerCase();
    let filtered = [];

    if (searchType === 'all') {
        filtered = players.filter(p => {
            const sports = Array.isArray(p.sports) ? p.sports : [p.sport].filter(Boolean);
            const positions = Object.values(p.sportPositions || {}).join(' ').toLowerCase();
            return (
                p.fullName.toLowerCase().includes(text) ||
                positions.includes(text) ||
                sports.some(s => s.toLowerCase().includes(text))
            );
        });
    } else if (searchType === 'name') {
        filtered = players.filter(p =>
            p.fullName.toLowerCase().includes(text)
        );
    } else if (searchType === 'sport') {
        filtered = players.filter(p => {
            const sports = Array.isArray(p.sports) ? p.sports : [p.sport].filter(Boolean);
            return sports.some(s => s.toLowerCase().includes(text));
        });
    } else if (searchType === 'position') {
        filtered = players.filter(p => {
            const positions = Object.values(p.sportPositions || {}).join(' ').toLowerCase();
            return positions.includes(text);
        });
    }

    displayPlayers(filtered);
}

function initializeApp() {
    const form = document.getElementById('registrationForm');
    form.addEventListener('submit', handleSubmit);

    const sportSelect = document.getElementById('sports');
    if (sportSelect) {
        sportSelect.addEventListener('change', updatePositionOptions);
    }

    const searchInput = document.getElementById('playerSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            filterPlayers(this.value.trim().toLowerCase());
        });
    }

    const searchTypeSelect = document.getElementById('searchType');
    if (searchTypeSelect) {
        searchTypeSelect.addEventListener('change', function () {
            const currentQuery = (document.getElementById('playerSearch')?.value || '').trim().toLowerCase();
            filterPlayers(currentQuery);
        });
    }

    const players = loadPlayers();
    displayPlayers(players);
}

document.addEventListener('DOMContentLoaded', initializeApp);

