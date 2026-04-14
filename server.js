import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameSession } from './src/gameLogic.js';
import { rateLimit } from 'express-rate-limit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : "*",
        methods: ["GET", "POST"]
    }
});
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

app.use(limiter);

app.use(express.static('public'));

const session = new GameSession();

let gameTimeout;

io.on('connection', (socket) => {
    socket.on('joinGame', (username) => {
        // Logic check: Allow re-joining if the ID exists (for refresh), 
        // but block brand new players if game status is 'active'
        const existingPlayer = session.players.find(p => p.name === username);
        
        if (session.status === 'active' && !existingPlayer) {
            return socket.emit('error', 'Game in progress. Please wait for the next round.');
        }

        const user = existingPlayer || session.addUser(socket.id, username);
        if (existingPlayer) existingPlayer.id = socket.id; // Update ID on refresh

        socket.emit('initPlayer', { ...user, id: socket.id });
        
        // If a game is currently active, send the question to the re-joined player
        if (session.status === 'active') {
            socket.emit('gameStarted', { question: session.currentQuestion });
        }
        io.emit('updatePlayers', session.getPlayers()); 
    });

    socket.on('setGameRules', (data) => {
        if (session.isMaster(socket.id)) {
            session.setQuestion(data.question, data.answer);
            session.setPlayerLimit(data.playerLimit);
            io.emit('gameReady');
        }
    });

    socket.on('startGame', () => {
        if (session.canStart(socket.id)) {
            session.start();
            io.emit('gameStarted', { question: session.currentQuestion });
            
            clearTimeout(gameTimeout); 
            gameTimeout = setTimeout(() => {
                const result = session.endByTimeout();
                if (result) {
                    io.emit('gameEnded', result);
                    io.emit('updatePlayers', session.getPlayers()); // Refresh scores/roles
                }
            }, 60000);
        }
    });

    socket.on('submitGuess', (guess) => {
        const result = session.handleGuess(socket.id, guess);

        if (result && result.isCorrect) {
            clearTimeout(gameTimeout);
            io.emit('gameEnded', result); 
            
            // Delay the role rotation so players can see the "Winner" screen first
            setTimeout(() => {
                session.rotateMaster(); 
                session.status = 'waiting';
                io.emit('updatePlayers', session.getPlayers());
            }, 5000);
        }
    });

    socket.on('disconnect', () => {
        session.removeUser(socket.id);
        if (session.players.length === 0) {
            session.resetAll(); // Logic to clear question/answer for a fresh start
        }
        io.emit('updatePlayers', session.getPlayers());
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));