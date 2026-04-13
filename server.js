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
        const user = session.addUser(socket.id, username);
        if (!user) {
            return socket.emit('error', 'Game in progress. Please wait.');
        }
        
        io.emit('updatePlayers', session.getPlayers());
        socket.emit('initPlayer', user);
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
        
        // If game ended (winner found)
        if (result && result.isCorrect) {
            session.status = 'waiting'; // Lock the game
            session.rotateMaster();  
            io.emit('gameEnded', result);
        } 
        // If game still active but guess was processed
        else if (result && result.isCorrect === false) {
            socket.emit('guessResult', result);
        }

        clearTimeout(gameTimeout);
        
        io.emit('updatePlayers', session.getPlayers());
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