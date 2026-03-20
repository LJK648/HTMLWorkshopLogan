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
    const sportSelect = document.getElementById('sport');
    const positionSelect = document.getElementById('position');
    const selectedSport = sportSelect.value;

    // Clear existing options
    positionSelect.innerHTML = '';

    if (!selectedSport || selectedSport === "Choose a Sport...") {
        positionSelect.innerHTML = '<option selected>Choose a Sport First...</option>';
        positionSelect.disabled = true;
        return;
    }

    positionSelect.disabled = false;

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.selected = true;
    defaultOption.textContent = `Choose a ${selectedSport} Position...`;
    positionSelect.appendChild(defaultOption);

    // Add sport-specific positions
    const positions = SPORT_POSITIONS[selectedSport] || [];
    positions.forEach(position => {
        const option = document.createElement('option');
        option.value = position;
        option.textContent = position;
        positionSelect.appendChild(option);
    });
}

function displayUserCard(userData) {
    const userCardContainer = document.getElementById('userCard');
    userCardContainer.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${escapeHtml(userData.fullName)}</h5>
                <p class="card-text">Email: ${escapeHtml(userData.email)}</p>
                <p class="card-text">Sport: ${escapeHtml(userData.sport)}</p>
                <p class="card-text">Position: ${escapeHtml(userData.position)}</p>
            </div>
        </div>
    `;
}

function displayPlayers(players) {
    const container = document.getElementById('playersContainer');
    container.innerHTML = '';

    if (!players.length) {
        container.innerHTML = '<div class="alert alert-info">No registered players yet.</div>';
        return;
    }

    players.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'card mb-2';

        card.innerHTML = `
            <div class="card-body d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="card-title mb-1">${escapeHtml(player.fullName)}</h5>
                    <p class="card-text mb-1">Email: ${escapeHtml(player.email)}</p>
                    <p class="card-text mb-1">Sport: ${escapeHtml(player.sport)}</p>
                    <p class="card-text mb-0">Position: ${escapeHtml(player.position)}</p>
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
    return {
        fullName: formData.get('fullName').trim(),
        email: formData.get('email').trim(),
        sport: formData.get('sport').trim(),
        position: formData.get('position').trim()
    };
}

function clearForm(form) {
    form.reset();
    updatePositionOptions();
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

    if (!player.fullName || !player.email || !player.sport || !player.position) {
        alert('Please fill in all fields.');
        return;
    }

    const players = loadPlayers();
    players.push(player);
    savePlayers(players);

    displayUserCard(player);
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

    let filtered = [];

    if (searchType === 'all') {
        // Search across all fields
        filtered = players.filter(p =>
            p.fullName.toLowerCase().includes(query) ||
            p.position.toLowerCase().includes(query) ||
            (p.sport && p.sport.toLowerCase().includes(query))
        );
    } else if (searchType === 'name') {
        // Search only by player name
        filtered = players.filter(p =>
            p.fullName.toLowerCase().includes(query)
        );
    } else if (searchType === 'sport') {
        // Search only by sport
        filtered = players.filter(p =>
            p.sport && p.sport.toLowerCase().includes(query)
        );
    } else if (searchType === 'position') {
        // Search only by position
        filtered = players.filter(p =>
            p.position.toLowerCase().includes(query)
        );
    }

    displayPlayers(filtered);
}

function initializeApp() {
    const form = document.getElementById('registrationForm');
    form.addEventListener('submit', handleSubmit);

    const sportSelect = document.getElementById('sport');
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

