import { UI } from './game.js';

const socket = io();
let myRole = { isMaster: false };

document.getElementById('btn-join').addEventListener('click', () => {
    const name = document.getElementById('username').value;
    if (name) socket.emit('joinGame', name);
});

socket.on('initPlayer', (player) => {
    myRole.isMaster = player.isMaster;
    UI.toggleView(true, player.isMaster);
    UI.appendMessage(`Welcome ${player.name}!`, 'system');
});

socket.on('updatePlayers', (players) => {
    UI.updateScoreboard(players);
});

document.getElementById('btn-setup').addEventListener('click', () => {
    const question = document.getElementById('q-input').value;
    const answer = document.getElementById('a-input').value;
    if (question && answer) {
        socket.emit('setGameRules', { question, answer });
        UI.appendMessage("Question set! You can now start the game.", "system");
    }
});

document.getElementById('btn-start').addEventListener('click', () => {
    socket.emit('startGame');
});

socket.on('gameStarted', (data) => {
    UI.appendMessage(`GAME STARTED: ${data.question}`, 'system');
});

document.getElementById('btn-guess').addEventListener('click', () => {
    const guess = document.getElementById('guess-input').value;
    if (guess) {
        socket.emit('submitGuess', guess);
        document.getElementById('guess-input').value = '';
    }
});

socket.on('guessResult', (res) => {
    UI.appendMessage(`Wrong! Attempts left: ${res.attemptsLeft}`);
});

socket.on('gameEnded', (data) => {
    const text = data.type === 'win' 
        ? `Winner: ${data.winner}! The answer was ${data.answer}` 
        : `Time up! No one won. The answer was ${data.answer}`;
    UI.appendMessage(text, 'system');
    
    // Refresh UI for next round master
    setTimeout(() => location.reload(), 5000); 
});