export const UI = {
    appendMessage: (text, type = 'user') => {
        const container = document.getElementById('message-display');
        const div = document.createElement('div');
        div.classList.add('msg');
        // Adding specific class for the sender
        div.classList.add(type === 'system' ? 'system' : 'user-msg');
        div.textContent = text;
        container.appendChild(div);
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    },

    updateQuestion: (text) => {
        document.getElementById('current-question-text').textContent = text;
    },

    showJoinTicker: (name) => {
        const ticker = document.getElementById('join-ticker');
        ticker.textContent = `${name} joined the room`;
        setTimeout(() => { if(ticker.textContent.includes(name)) ticker.textContent = ''; }, 3000);
    },

    updateScoreboard: (players, currentSocketId) => {
        const list = document.getElementById('score-list');
        list.textContent = ''; 
        players.forEach(p => {
            const li = document.createElement('li');
            if (p.id === currentSocketId) {
                li.classList.add('current-player');
            }
            li.textContent = `${p.name}: ${p.score}pts | ${p.isMaster ? '[Master]' : `Remaining: ${p.attempts}`}`;
            list.appendChild(li);
        });
        document.getElementById('player-count').textContent = `Players: ${players.length}`;
    },

    toggleView: (isLoggedIn, isMaster = false) => {
        const auth = document.getElementById('auth-screen');
        const game = document.getElementById('game-container');
        const master = document.getElementById('master-controls');
        const player = document.getElementById('player-controls');

        auth.classList.toggle('hidden', isLoggedIn);
        game.classList.toggle('hidden', !isLoggedIn);
        
        // Crucial: Ensure when a game ends, the new Master gets their controls
        master.classList.toggle('hidden', !isMaster);
        player.classList.toggle('hidden', isMaster);
    },
};