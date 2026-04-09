export class GameSession {
    constructor() {
        this.players = [];
        this.status = 'waiting'; // waiting, active, ended
        this.currentQuestion = "";
        this.currentAnswer = "";
        this.masterIndex = 0;
    }

    addUser(id, name) {
        if (this.status === 'active') return null;
        const player = {
            id,
            lastGuessTime: 0,
            name: name.replace(/<[^>]*>?/gm, ''), // Basic XSS sanitization
            score: 0,
            attempts: 3,
            isMaster: this.players.length === 0
        };
        this.players.push(player);
        return player;
    }

    setQuestion(q, a) {
    this.currentQuestion = q.replace(/<[^>]*>?/gm, ''); // Sanitize Question
    this.currentAnswer = a.replace(/<[^>]*>?/gm, '').toLowerCase().trim(); // Sanitize Answer
}

    canStart(id) {
        return this.isMaster(id) && this.players.length >= 3;
    }

    start() {
        this.status = 'active';
        this.players.forEach(p => p.attempts = 3);
    }

    handleGuess(id, guess) {
        if (this.status !== 'active') return null;
        const player = this.players.find(p => p.id === id);
        
        // Basic Security
        if (!player || player.isMaster || player.attempts <= 0) return null;

        // Socket Rate Limiting (1 guess per second)
        const now = Date.now();
        if (now - player.lastGuessTime < 1000) return null; 
        player.lastGuessTime = now;

        player.attempts--;
        const isCorrect = guess.toLowerCase().trim() === this.currentAnswer;

        if (isCorrect) {
            player.score += 10;
            return { 
                isCorrect: true, 
                winner: player.name, 
                winnerId: id,
                answer: this.currentAnswer,
                type: 'win'
            };
        }
        return { isCorrect: false, attemptsLeft: player.attempts };
    }

        resetAll() {
        this.currentQuestion = "";
        this.currentAnswer = "";
        this.status = 'waiting';
    }

    endGame(winnerName) {
        const data = { 
            winner: winnerName, 
            answer: this.currentAnswer,
            type: winnerName ? 'win' : 'timeout' 
        };
        this.status = 'waiting';
        this.rotateMaster();
        return data;
    }

    endByTimeout() {
        if (this.status === 'active') return this.endGame(null);
        return null;
    }

    rotateMaster() {
        this.status = 'waiting'; // Ensure game is stopped
        this.players.forEach(p => p.isMaster = false);
        this.masterIndex = (this.masterIndex + 1) % this.players.length;
        if (this.players[this.masterIndex]) {
            this.players[this.masterIndex].isMaster = true;
        }
    }

    isMaster(id) {
        return this.players.find(p => p.id === id)?.isMaster;
    }

    getPlayers() {
        return this.players.map(({id, ...rest}) => rest);
    }

    removeUser(id) {
        this.players = this.players.filter(p => p.id !== id);
        if (this.players.length > 0 && !this.players.some(p => p.isMaster)) {
            this.players[0].isMaster = true;
        }
    }
}