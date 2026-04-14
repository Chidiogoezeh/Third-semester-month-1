export class GameSession {
    constructor() {
        this.players = [];
        this.status = 'waiting'; // waiting, active, ended
        this.currentQuestion = "";
        this.currentAnswer = "";
        this.masterIndex = 0;
        this.requiredPlayers = 3;
    }

    addUser(id, name) {
        // 1. Check if game is in progress
        // 2. Check if player limit reached
        if (this.status === 'active' || this.players.length >= this.requiredPlayers) {
            return null; 
        }
        
        const player = {
            id,
            name: name.replace(/<[^>]*>?/gm, ''), 
            score: 0,
            attempts: 3,
            isMaster: this.players.length === 0 // First person is permanent Master
        };
        this.players.push(player);
        return player;
    }

    setPlayerLimit(limit) {
        const num = parseInt(limit);
        if (!isNaN(num) && num >= 3) {
            this.requiredPlayers = num;
        }
    }

    setQuestion(q, a) {
        if (!q || !a || q.length > 200 || a.length > 50) return false;
        this.currentQuestion = q.trim(); 
        // Ensure we store a clean lowercase version for comparison
        this.currentAnswer = a.toLowerCase().trim().replace(/\s+/g, ' '); 
        return true;
    }

    canStart(id) {
        return this.isMaster(id) && this.players.length >= this.requiredPlayers;
    }

    start() {
        this.status = 'active';
        this.players.forEach(p => p.attempts = 3);
    }

    handleGuess(id, guess) {
        if (this.status !== 'active') return null;
        const player = this.players.find(p => p.id === id);
        if (!player || player.isMaster || player.attempts <= 0) return null;

        player.attempts--;
        const isCorrect = guess.toLowerCase().trim() === this.currentAnswer;

        if (isCorrect) {
            this.status = 'ended'; 
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
        this.players = [];
        this.status = 'waiting';
        this.currentQuestion = "";
        this.currentAnswer = "";
        this.masterIndex = 0;
        this.requiredPlayers = 3; // Reset to default minimum
    }

    endGame(winnerName) {
    const data = { 
        winner: winnerName, 
        answer: this.currentAnswer,
        type: winnerName ? 'win' : 'timeout' 
    };
    this.status = 'waiting';
    return data;
}

    endByTimeout() {
        if (this.status === 'active') return this.endGame(null);
        return null;
    }

    rotateMaster() {
        // Rule: No automatic rotation. Master remains master.
        return; 
    }

    isMaster(id) {
        return this.players.find(p => p.id === id)?.isMaster;
    }

    getPlayers() {
        return this.players.map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            attempts: p.attempts,
            isMaster: p.isMaster
        }));
    }

    removeUser(id) {
        // Find if the leaving user was the Master
        const wasMaster = this.isMaster(id);
        this.players = this.players.filter(p => p.id !== id);

        // Only rotate Master if the current one left and there are players left
        if (wasMaster && this.players.length > 0) {
            this.players[0].isMaster = true;
            return true; // Return true to indicate a master change occurred
        }
        return false;
    }
}