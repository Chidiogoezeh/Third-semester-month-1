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
        document.getElementById('auth-screen').classList.toggle('hidden', isLoggedIn);
        document.getElementById('game-container').classList.toggle('hidden', !isLoggedIn);
        document.getElementById('master-controls').classList.toggle('hidden', !isMaster);
        document.getElementById('player-controls').classList.toggle('hidden', isMaster);
    }
};