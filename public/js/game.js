export const UI = {
    appendMessage: (text, type = 'user') => {
        const container = document.getElementById('message-display');
        const div = document.createElement('div');
        div.classList.add('msg');
        if (type === 'system') div.classList.add('system');
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    updateScoreboard: (players) => {
        const list = document.getElementById('score-list');
        list.textContent = ''; 
        players.forEach(p => {
            const li = document.createElement('li');
            // ADD: p.attempts to the textContent
            li.textContent = `${p.name}: ${p.score}pts | ${p.isMaster ? '[Master]' : `Attempts: ${p.attempts}`}`;
            list.appendChild(li);
        });
        document.getElementById('player-count').textContent = `Players: ${players.length}`;
        
        const startBtn = document.getElementById('btn-start');
        if(startBtn) startBtn.disabled = players.length < 3;
    },

    toggleView: (isLoggedIn, isMaster = false) => {
        document.getElementById('auth-screen').classList.toggle('hidden', isLoggedIn);
        document.getElementById('game-container').classList.toggle('hidden', !isLoggedIn);
        document.getElementById('master-controls').classList.toggle('hidden', !isMaster);
        document.getElementById('player-controls').classList.toggle('hidden', isMaster);
    }
};