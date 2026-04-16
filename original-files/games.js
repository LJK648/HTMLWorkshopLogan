const STORAGE_KEY = 'vernball_games';

function loadGames() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  try {
    const games = JSON.parse(json);
    return Array.isArray(games) ? games : [];
  } catch (e) {
    console.error('Error parsing games from localStorage', e);
    return [];
  }
}

function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function displayGames(games) {
  const container = $('#gamesContainer');
  container.empty();

  if (!games.length) {
    container.append('<div class="alert alert-info">No games added yet. Create one using the form.</div>');
    return;
  }

  games.forEach(game => {
    const card = $(
      `<div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">${escapeHtml(game.gameName)}</h5>
          <p class="card-text"><strong>Sport:</strong> ${escapeHtml(game.sport)}</p>
          <p class="card-text"><strong>Location:</strong> ${escapeHtml(game.location)}</p>
          <p class="card-text"><strong>Date & Time:</strong> ${escapeHtml(formatDateTime(game.dateTime))}</p>
          <p class="card-text"><strong>Players signed up:</strong> ${game.playerCount}</p>
          <button class="btn btn-info btn-sm me-2 btn-view-signups" data-gameid="${game.gameId}">View Signups</button>
          <button class="btn btn-success btn-sm me-2 btn-join" data-gameid="${game.gameId}">Join</button>
          <button class="btn btn-danger btn-sm btn-delete" data-gameid="${game.gameId}">Delete</button>
        </div>
      </div>`
    );

    card.find('.btn-view-signups').on('click', function () {
      viewSignups(game.gameId);
    });

    card.find('.btn-join').on('click', function () {
      signup(game.gameId);
    });

    card.find('.btn-delete').on('click', function () {
      deleteGame(game.gameId);
    });

    container.append(card);
  });
}

function escapeHtml(text) {
  return $('<div>').text(text).html();
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  const dt = new Date(value);
  if (isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

function addGame(event) {
  event.preventDefault();

  const gameName = $('#gameName').val().trim();
  const sport = $('#sport').val();
  const dateTime = $('#dateTime').val();
  const location = $('#location').val().trim();

  if (!gameName || !sport || !dateTime || !location) {
    alert('Please fill all fields.');
    return;
  }

  const games = loadGames();
  const newGame = {
    gameId: Date.now(),
    gameName,
    sport,
    dateTime,
    location,
    playerCount: 0,
    signups: []
  };

  games.push(newGame);
  saveGames(games);
  displayGames(games);
  $('#gameForm')[0].reset();
}

function viewSignups(gameId) {
  const games = loadGames();
  const game = games.find(g => g.gameId === gameId);

  if (!game) {
    alert('Game not found.');
    return;
  }

  if (!game.signups || game.signups.length === 0) {
    alert(`No one has signed up for ${game.gameName} yet.`);
    return;
  }

  let signupList = `Signups for ${game.gameName}:\n\n`;
  game.signups.forEach((player, index) => {
    signupList += `${index + 1}. ${escapeHtml(player.name)}\n   Email: ${escapeHtml(player.email)}\n\n`;
  });

  alert(signupList);
}

function signup(gameId) {
  const games = loadGames();
  const idx = games.findIndex(g => g.gameId === gameId);

  if (idx === -1) {
    alert('Game not found.');
    return;
  }

  const name = prompt('Enter your name:');
  if (!name || !name.trim()) {
    return;
  }

  const email = prompt('Enter your email:');
  if (!email || !email.trim()) {
    return;
  }

  games[idx].signups.push({ name: name.trim(), email: email.trim() });
  games[idx].playerCount = games[idx].signups.length;
  saveGames(games);
  displayGames(games);
  alert(`Successfully joined ${games[idx].gameName}!`);
}

function deleteGame(gameId) {
  const games = loadGames();
  const idx = games.findIndex(g => g.gameId === gameId);
  if (idx === -1) {
    alert('Game not found.');
    return;
  }

  if (!confirm(`Delete ${games[idx].gameName}?`)) {
    return;
  }

  games.splice(idx, 1);
  saveGames(games);
  displayGames(games);
  alert('Game deleted.');
}

function filterGames(query) {
  const games = loadGames();
  const searchType = document.getElementById('searchType')?.value || 'all';
  
  if (!query) {
    displayGames(games);
    return;
  }

  let filtered = [];

  if (searchType === 'all') {
    filtered = games.filter(g =>
      g.gameName.toLowerCase().includes(query) ||
      g.sport.toLowerCase().includes(query) ||
      (g.signups && g.signups.some(s => s.name.toLowerCase().includes(query)))
    );
  } else if (searchType === 'name') {
    filtered = games.filter(g =>
      g.gameName.toLowerCase().includes(query)
    );
  } else if (searchType === 'sport') {
    filtered = games.filter(g =>
      g.sport.toLowerCase().includes(query)
    );
  } else if (searchType === 'player') {
    filtered = games.filter(g =>
      g.signups && g.signups.some(s => s.name.toLowerCase().includes(query))
    );
  }

  displayGames(filtered);
}

$(document).ready(function () {
  const games = loadGames();
  displayGames(games);

  $('#gameForm').on('submit', addGame);

  const searchInput = document.getElementById('gameSearch');
  if (searchInput) {
    searchInput.addEventListener('keyup', function () {
      filterGames(this.value.trim().toLowerCase());
    });
  }

  const searchTypeSelect = document.getElementById('searchType');
  if (searchTypeSelect) {
    searchTypeSelect.addEventListener('change', function () {
      const currentQuery = (document.getElementById('gameSearch')?.value || '').trim().toLowerCase();
      filterGames(currentQuery);
    });
  }
});
