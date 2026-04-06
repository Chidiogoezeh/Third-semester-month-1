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
            name: name.replace(/<[^>]*>?/gm, ''), // Basic XSS sanitization
            score: 0,
            attempts: 3,
            isMaster: this.players.length === 0
        };
        this.players.push(player);
        return player;
    }

    setQuestion(q, a) {
        this.currentQuestion = q;
        this.currentAnswer = a.toLowerCase().trim();
    }

    canStart(id) {
        return this.isMaster(id) && this.players.length >= 3;
    }

    start() {
        this.status = 'active';
        this.players.forEach(p => p.attempts = 3);
    }

    handleGuess(id, guess) {
        if (this.status !== 'active') return { message: "Game not active" };
        const player = this.players.find(p => p.id === id);
        if (!player || player.isMaster || player.attempts <= 0) return { message: "Cannot guess" };

        player.attempts--;
        const isCorrect = guess.toLowerCase().trim() === this.currentAnswer;

        if (isCorrect) {
            player.score += 10;
            return this.endGame(player.name);
        }
        return { isCorrect: false, attemptsLeft: player.attempts };
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