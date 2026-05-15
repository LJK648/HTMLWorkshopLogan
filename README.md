# Vernball Website

## Overview
Vernball is a front-end web application developed as part of IST 256 (Program for the Web). It serves as a club-style portal for managing teams, players, and game-related workflows. The project is built with a component-based structure and focuses on clean UI design, navigation, and modular page organization.
---
## Core Features
- Team creation and management workflow
- Player registration system
- Game scheduling and approval flow
- Game history tracking
- Hall of Fame leaderboard page
- Modular navigation system across all views
- Responsive front-end layout
---
## Components / Pages

The application is structured into reusable React-style components:

- `Home.js` – Landing page and entry point for users  
- `Navigation.js` – Global navigation bar used across the application  
- `PlayerRegistration.js` – Form for registering new players  
- `TeamBuilder.js` – Interface for creating and managing teams  
- `TeamsList.js` – Displays all registered teams  
- `Games.js` – Main games overview and scheduling interface  
- `GameApprovalPage.js` – Handles game approval workflow  
- `GameHistory.js` – Displays past games and results  
- `HallOfFame.js` – Showcases top-performing players or teams  
---
## Tech Stack
- React (component-based UI architecture)
- JavaScript (ES6+)
- HTML5 & CSS3
- Bootstrap (layout and styling)
- Node Package Manager (for dependencies, if applicable)
---
## Project Structure

src/
│
├── components/
│   ├── Home.js
│   ├── Navigation.js
│   ├── PlayerRegistration.js
│   ├── TeamBuilder.js
│   ├── TeamsList.js
│   ├── Games.js
│   ├── GameApprovalPage.js
│   ├── GameHistory.js
│   └── HallOfFame.js
│
├── App.js
└── index.js

How to Run Locally

1. Clone the repository:
Bash
git clone https://github.com/LJK648/HTMLWorkshopLogan.git
2. Navigate into the project directory:
Bash
cd HTMLWorkshopLogan
3. Install dependencies:
Bash
nom install
4. Start the development server:
Bash
npm
start
5. Open in browser:
http://localhost:3000

Deployment (Render)
Deployment Steps:
1. Push the project to GitHub
2. Log in to Render: https://render.com
3. Create a new Static Site
4. Connect the GitHub repository
5. Configure settings:
• Build Command: npm run build
• Publish Directory: build
6. Deploy
Render will automatically rebuild and deploy updates when changes are pushed to the repository.
Architecture Notes
• Component-based structure improves maintainability and scalability
• Separation of concerns between Ul pages and navigation logic
• Designed for extensibility (additional features such as authentication or backend integration can be added)
Limitations
• No backend database integration (We integrated one through Render later on)
• Data is not persisted across sessions (Unless setup with proper database connections)
• Authentication and authorization not implemented

Team:

IST 256 – Program for the Web
Group Project Contributors: Logan K, Will W, Eoin F, Jeffrey B
