import { UI } from './game.js';

const socket = io();
let myId = null;
let isMasterStatus = false;

document.getElementById('btn-join').addEventListener('click', () => {
    const name = document.getElementById('username').value.trim();
    if (name) socket.emit('joinGame', name);
});

socket.on('initPlayer', (player) => {
    myId = socket.id;
    isMasterStatus = player.isMaster;
    UI.toggleView(true, player.isMaster);
    UI.appendMessage(`You joined as ${player.isMaster ? 'Master' : 'Player'}.`, 'system');
});

socket.on('updatePlayers', (players) => {
    const me = players.find(p => p.id === socket.id);
    
    // Notify room of new joiners
    if (players.length > 0) {
        const latest = players[players.length - 1];
        // Only show message if it's not the user themselves (already handled in init)
        if (latest.id !== socket.id) {
            UI.appendMessage(`${latest.name} joined the game!`, 'system');
        }
    }

    // Role switch logic
    if (me && me.isMaster && !isMasterStatus) {
        isMasterStatus = true;
        UI.toggleView(true, true);
        UI.appendMessage("The crown has passed to you! You are the new Master.", "system");
    }
    
    UI.updateScoreboard(players, socket.id);
    
    // Enable/Disable Start button based on player count
    const startBtn = document.getElementById('btn-start');
    if (startBtn) startBtn.disabled = players.length < 3;
});

document.getElementById('btn-setup').addEventListener('click', () => {
    const question = document.getElementById('q-input').value.trim();
    const answer = document.getElementById('a-input').value.trim();
    if (question && answer) {
        socket.emit('setGameRules', { question, answer, playerLimit: 3 });
        UI.appendMessage("Question & Answer locked in!", "system");
    }
});

document.getElementById('btn-start').addEventListener('click', () => {
    socket.emit('startGame');
});

socket.on('gameStarted', (data) => {
    UI.appendMessage(`QUESTION: ${data.question}`, 'system');
    document.getElementById('btn-guess').disabled = false;
    document.getElementById('guess-input').disabled = false;
});

document.getElementById('btn-guess').addEventListener('click', () => {
    const guessInput = document.getElementById('guess-input');
    const guess = guessInput.value.trim();
    if (guess) {
        socket.emit('submitGuess', guess);
        guessInput.value = '';
    }
});

socket.on('guessResult', (res) => {
    UI.appendMessage(`Wrong! ${res.attemptsLeft} attempts remaining.`);
    if (res.attemptsLeft <= 0) {
        document.getElementById('btn-guess').disabled = true;
        document.getElementById('guess-input').disabled = true;
    }
});

socket.on('gameEnded', (data) => {
    // Immediately disable controls for everyone
    document.getElementById('btn-guess').disabled = true;
    document.getElementById('guess-input').disabled = true;

    const winMsg = data.type === 'win' 
        ? `GAME OVER: ${data.winner} guessed correctly! The answer was "${data.answer}".` 
        : `TIME EXPIRED: No one guessed it. The answer was "${data.answer}".`;
    
    UI.appendMessage(winMsg, 'system');
    
    if (data.winnerId === socket.id) {
        UI.appendMessage("YOU HAVE WON! +10 Points awarded.", "system");
    }

    setTimeout(() => {
        UI.appendMessage("Preparing next round... New master is being assigned.", "system");
        // Clear inputs for the next round
        document.getElementById('q-input').value = '';
        document.getElementById('a-input').value = '';
    }, 4000);
});