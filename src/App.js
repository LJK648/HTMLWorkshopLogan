import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Home from './components/Home';
import PlayerRegistration from './components/PlayerRegistration';
import Games from './components/Games';
import TeamBuilder from './components/TeamBuilder';
import TeamsList from './components/TeamsList';
import HallOfFame from './components/HallOfFame';
import GameHistory from './components/GameHistory';
import GameApprovalPage from './components/GameApprovalPage';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navigation />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<PlayerRegistration />} />
            <Route path="/games" element={<Games />} />
            <Route path="/team-builder" element={<TeamBuilder />} />
            <Route path="/game-history" element={<GameHistory />} />
            <Route path="/game-approval" element={<GameApprovalPage />} />
            <Route path="/teams-list" element={<TeamsList />} />
            <Route path="/hof" element={<HallOfFame />} />
          </Routes>
        </main>
        <footer className="footer mt-5">
          <div className="container">
            <p>&copy; 2024 Vernball Rec League. All rights reserved.</p>
            <p>
              <a href="/">Home</a>
              <a href="/register">Register</a>
              <a href="/games">Games</a>
              <a href="/hof">Hall of Fame</a>
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
