// JavaScript code
const STORAGE_KEY = "vernball_players";

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

function displayUserCard(userData) {
    const userCardContainer = document.getElementById('userCard');
    userCardContainer.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${escapeHtml(userData.fullName)}</h5>
                <p class="card-text">Email: ${escapeHtml(userData.email)}</p>
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
        position: formData.get('position').trim()
    };
}

function clearForm(form) {
    form.reset();
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

    if (!player.fullName || !player.email || !player.position) {
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
    if (!query) {
        displayPlayers(players);
        return;
    }

    const filtered = players.filter(p =>
        p.fullName.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query)
    );

    displayPlayers(filtered);
}

function initializeApp() {
    const form = document.getElementById('registrationForm');
    form.addEventListener('submit', handleSubmit);

    const searchInput = document.getElementById('playerSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            filterPlayers(this.value.trim().toLowerCase());
        });
    }

    const players = loadPlayers();
    displayPlayers(players);
}

document.addEventListener('DOMContentLoaded', initializeApp);

