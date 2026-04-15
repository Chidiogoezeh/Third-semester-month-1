Guessing Game API & Interface
A real-time, multi-player RESTful and WebSocket-based application built with Node.js, Express, and Socket.io. This project facilitates a "Master vs. Players" game loop where users compete to guess hidden answers in a live-chat environment.

- Game Context
The Guessing Game is a fun, interactive platform for friends to test their wits.

The Master: Sets a question and a secret answer.

The Players: Join the session and attempt to guess the answer within a time limit.

The Goal: Guess correctly to earn points and claim the crown for the next round.

- Features
-- Game Management
Dynamic Sessions: Create game rooms with a set number of players.

Master Control: Only the Game Master can set the question, answer, and player limit.

Player Limit & Lockdown: Master can define the required number of players (Min 3). No new players can join once a session is active.

Persistent Roles: Roles and scores stay distinct and persist even if a browser is refreshed during the round.

-- Gameplay Mechanics
Live Chat Interface: Real-time message display for system notifications and player guesses.

3-Attempt Rule: Each player has exactly three tries per round to get the answer right.

Point System: 10 points awarded to the winner of each round.

Master Rotation: Upon round completion (Win or Timeout), the role of Game Master rotates to another player automatically.

60-Second Timeout: If no one guesses correctly within 60 seconds, the round ends with no points awarded.

-- Visuals & UX
Responsive Design: Optimized for mobile and desktop using modern CSS (Flexbox, Grid, and dvh units).

Immersive Background: Custom repeating background pattern with a "glassmorphism" UI overlay for readability.

Scoreboard: Real-time leaderboard tracking all connected players' points and remaining attempts.

- Tech Stack
Runtime: Node.js (ES6 Modules)

Framework: Express.js

Real-time Engine: Socket.io

Frontend: Vanilla JS, CSS3, HTML5

Security: Input sanitization (XSS protection) and Rate Limiting

- Project Architecture (MVC)
The project follows a modular structure to ensure clean separation of game logic and network communication:

Server: index.js (Socket.io event handling)

Logic: src/gameLogic.js (State management, scoring, and role rotation)

UI/View: public/js/game.js (DOM manipulation)

Client Logic: public/js/socket-client.js (Client-side event listeners)

- Installation & Setup
-- Clone the repository:
git clone https://github.com/Chidiogoezeh/Third-semester-month-1.git
cd guessing-game-project

-- Install dependencies:
npm install

-- Environment Variables:
Create a .env file in the root directory:
PORT=3000

-- Run the application:
npm start

The server will run on http://localhost:3000.

- API & Socket Events
-- Connection & Auth
joinGame: Payload {username}. Adds a player to the lobby.

initPlayer: Received by client upon successful join.

updatePlayers: Broadcasts the full list of players and scores.

-- Master Actions
setGameRules: Set the question, answer, and player limit.

startGame: Master triggers the 60-second timer and unlocks guessing.

-- Gameplay
submitGuess: Player sends a string to be checked against the answer.

gameEnded: Broadcasts when a player wins or the timer expires.

error: Triggered if a user tries to join a full or active session.

- Info
Validation: All inputs (Question/Answer/Nickname) are trimmed and sanitized server-side.

Session Lifecycle: The Game Session is fully cleared and reset once the last player leaves the room.

Minimum Requirements: A minimum of 3 players is strictly enforced to start any round.