import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="hero">
      <div className="container">
        <h1>Welcome to Vernball Rec League</h1>
        <p>Manage players, teams, games, and celebrate our champions.</p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-outline-light">Register a Player</Link>
          <Link to="/games" className="btn btn-outline-light">View Games</Link>
          <Link to="/team-builder" className="btn btn-outline-light">Build a Team</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
