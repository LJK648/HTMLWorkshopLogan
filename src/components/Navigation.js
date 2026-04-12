import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src="/images/vernball-logo.JPG" alt="Vernball Logo" width="40" height="40" className="me-2" />
          Vernball League
        </Link>

        <div>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/register">Player Registration</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/hof">Hall of Fame</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/games">Games</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/team-builder">Team Builder</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/teams-list">View Teams</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
