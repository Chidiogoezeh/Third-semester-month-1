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
    // Check if I am now the master
    const me = players.find(p => p.name === document.getElementById('username').value);
    if (me && me.isMaster && !myRole.isMaster) {
        myRole.isMaster = true;
        UI.toggleView(true, true); // Update UI to show master controls
        UI.appendMessage("You are now the Game Master!", "system");
    }
    UI.updateScoreboard(players);
});

document.getElementById('btn-setup').addEventListener('click', () => {
    const question = document.getElementById('q-input').value;
    const answer = document.getElementById('a-input').value;
    const limit = document.getElementById('limit-input').value;
    if (question && answer) {
        socket.emit('setGameRules', { question, answer, playerLimit: limit });
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
    if (res.attemptsLeft === 0) {
        document.getElementById('btn-guess').disabled = true;
        document.getElementById('guess-input').disabled = true;
        UI.appendMessage("You have used all your attempts!", "system");
    }
});

socket.on('gameEnded', (data) => {
    if (data.type === 'win') {
        if (data.winnerId === socket.id) {
            UI.appendMessage("YOU HAVE WON! +10 points", 'system');
        } else {
            UI.appendMessage(`${data.winner} won! Answer: ${data.answer}`, 'system');
        }
    } else {
        UI.appendMessage(`Time's up! No winner. Answer: ${data.answer}`, 'system');
    }
    
    // Delay to let players see results, then refresh to assign new Master
    setTimeout(() => {
        window.location.reload(); 
    }, 5000); 
});