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
        const qText = document.getElementById('current-question-text');
        qText.textContent = text;
        // Visually highlight the question area
        qText.parentElement.style.backgroundColor = '#6c5ce7'; 
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
        document.getElementById('auth-screen').classList.toggle('hidden', isLoggedIn);
        document.getElementById('game-container').classList.toggle('hidden', !isLoggedIn);
        
        const mControls = document.getElementById('master-controls');
        const pControls = document.getElementById('player-controls');

        // Ensure Master NEVER sees the guess input, and Players NEVER see set question
        mControls.classList.toggle('hidden', !isMaster);
        pControls.classList.toggle('hidden', isMaster);
    }
};