import React, { useState } from 'react';
import './App.css';
import './WebProject.css';
import PlayerRegistration from './components/PlayerRegistration';
import TeamBuilderForm from './components/TeamBuilderForm';
import TeamsList from './components/TeamsList';
import GamesList from './components/GamesList';

const pages = [
  { id: 'register', label: 'Register' },
  { id: 'teamBuilder', label: 'Team Builder' },
  { id: 'teamsList', label: 'Teams List' },
  { id: 'games', label: 'Games' }
];

function App() {
  const [activePage, setActivePage] = useState('register');

  return (
    <div className="App container py-4">
      <div className="mb-4">
        <div className="btn-group" role="group" aria-label="Page selection">
          {pages.map(page => (
            <button
              key={page.id}
              type="button"
              className={`btn btn-${activePage === page.id ? 'primary' : 'outline-primary'}`}
              onClick={() => setActivePage(page.id)}
            >
              {page.label}
            </button>
          ))}
        </div>
      </div>

      {activePage === 'register' && <PlayerRegistration />}
      {activePage === 'teamBuilder' && <TeamBuilderForm />}
      {activePage === 'teamsList' && <TeamsList />}
      {activePage === 'games' && <GamesList />}
    </div>
  );
}

export default App;
