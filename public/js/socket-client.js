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

/* Correct the updatePlayers logic in socket-client.js */
socket.on('updatePlayers', (players) => {
    const me = players.find(p => p.id === socket.id);
    
    // Update local master status based on server-side rotation
    if (me) {
        if (me.isMaster !== isMasterStatus) {
            isMasterStatus = me.isMaster;
            UI.toggleView(true, isMasterStatus);
            const roleMsg = isMasterStatus ? "You are the new Master!" : "You are now a Player.";
            UI.appendMessage(roleMsg, "system");
        }
    }
    
    UI.updateScoreboard(players, socket.id);
    const startBtn = document.getElementById('btn-start');
    // Master can only start if current player count matches or exceeds limit
    if (startBtn) startBtn.disabled = (players.length < 3);
});

// MASTER ACTIONS
/* Correct the setup listener in socket-client.js */
document.getElementById('btn-setup').addEventListener('click', () => {
    const question = document.getElementById('q-input').value.trim();
    const answer = document.getElementById('a-input').value.trim();
    const limit = document.getElementById('limit-input').value || 3;
    
    if (question && answer) {
        socket.emit('setGameRules', { 
            question, 
            answer, 
            playerLimit: parseInt(limit) 
        });
    }
});

socket.on('gameReady', () => {
    UI.appendMessage("Question is locked. Master can start!", "system");
    if (isMasterStatus) document.getElementById('btn-start').disabled = false;
});

document.getElementById('btn-start').addEventListener('click', () => socket.emit('startGame'));

// GAMEPLAY
socket.on('gameStarted', (data) => {
    // Clear the message display to focus on the game (No innerHTML used)
    const display = document.getElementById('message-display');
    while (display.firstChild) display.removeChild(display.firstChild);
    
    UI.updateQuestion(data.question);
    UI.appendMessage("--- ROUND STARTED ---", "system");

    if (!isMasterStatus) {
        const gBtn = document.getElementById('btn-guess');
        const gInput = document.getElementById('guess-input');
        gBtn.disabled = false;
        gInput.disabled = false;
        gInput.focus();
    }
});

socket.on('error', (msg) => {
    alert(msg);
    sessionStorage.removeItem('guess_name');
    location.reload();
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
    
    const resultText = data.type === 'win' ? `Winner: ${data.winner}!` : `Time's up!`;
    UI.updateQuestion(`${resultText} Answer: ${data.answer}`);
    
    // Display result in chat
    UI.appendMessage(`--- ${resultText} ---`, 'system');

    setTimeout(() => {
        // Prepare for next round without master rotation
        UI.updateQuestion("Master is preparing the next question...");
        if (isMasterStatus) {
            document.getElementById('q-input').value = '';
            document.getElementById('a-input').value = '';
        }
    }, 5000);
});