import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const heroStyle = {
    backgroundImage: `
      linear-gradient(
        135deg,
        rgba(128,0,0,0.85) 0%,
        rgba(80,0,0,0.8) 50%,
        rgba(0,0,0,0.7) 100%
      ),
      url('${process.env.PUBLIC_URL}/images/trophy1.JPG'),
      url('${process.env.PUBLIC_URL}/images/trophy2.JPG'),
      url('${process.env.PUBLIC_URL}/images/vernball-logo.JPG')
    `,
    backgroundPosition: '0 0, 10% 20%, 90% 80%, 50% 50%',
    backgroundSize: 'cover, 250px 250px, 280px 280px, 300px 300px',
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="hero" style={heroStyle}>
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
