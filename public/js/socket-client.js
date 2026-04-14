import { UI } from './game.js';

const socket = io();
let isMasterStatus = false;

// Auto-rejoin on refresh
const savedName = sessionStorage.getItem('guess_name');
if (savedName) socket.emit('joinGame', savedName);

document.getElementById('btn-join').addEventListener('click', () => {
    const name = document.getElementById('username').value.trim();
    if (name) {
        sessionStorage.setItem('guess_name', name);
        socket.emit('joinGame', name);
    }
});

socket.on('initPlayer', (player) => {
    isMasterStatus = player.isMaster;
    UI.toggleView(true, player.isMaster);
    UI.appendMessage(`Logged in as ${player.name}`, 'system');
});

socket.on('updatePlayers', (players) => {
    const me = players.find(p => p.id === socket.id);
    if (players.length > 0) {
        const latest = players[players.length - 1];
        if (latest.id !== socket.id) UI.showJoinTicker(latest.name);
    }

    if (me && me.isMaster && !isMasterStatus) {
        isMasterStatus = true;
        UI.toggleView(true, true);
        UI.appendMessage("You are now the Master!", "system");
    }
    UI.updateScoreboard(players, socket.id);
    const startBtn = document.getElementById('btn-start');
    if (startBtn) startBtn.disabled = players.length < 3;
});

// MASTER ACTIONS
document.getElementById('btn-setup').addEventListener('click', () => {
    const question = document.getElementById('q-input').value.trim();
    const answer = document.getElementById('a-input').value.trim();
    if (question && answer) socket.emit('setGameRules', { question, answer, playerLimit: 3 });
});

socket.on('gameReady', () => {
    UI.appendMessage("Question is locked. Master can start!", "system");
    if (isMasterStatus) document.getElementById('btn-start').disabled = false;
});

document.getElementById('btn-start').addEventListener('click', () => socket.emit('startGame'));

// GAMEPLAY
socket.on('gameStarted', (data) => {
    UI.updateQuestion(data.question);
    if (!isMasterStatus) {
        document.getElementById('btn-guess').disabled = false;
        document.getElementById('guess-input').disabled = false;
        document.getElementById('guess-input').focus();
    }
});

document.getElementById('btn-guess').addEventListener('click', () => {
    const input = document.getElementById('guess-input');
    if (input.value.trim()) {
        socket.emit('submitGuess', input.value.trim());
        input.value = '';
    }
});

socket.on('gameEnded', (data) => {
    document.getElementById('btn-guess').disabled = true;
    document.getElementById('guess-input').disabled = true;
    
    const resultText = data.type === 'win' ? `CORRECT! ${data.winner} won.` : `TIME UP!`;
    UI.updateQuestion(`${resultText} Answer: ${data.answer}`);
    UI.appendMessage(resultText, 'system');

    setTimeout(() => {
        UI.updateQuestion("Waiting for Master to set question...");
        document.getElementById('q-input').value = '';
        document.getElementById('a-input').value = '';
    }, 5000);
});