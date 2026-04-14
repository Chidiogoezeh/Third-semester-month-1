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
    /* Corrected joinGame listener in server.js */
    socket.on('joinGame', (username) => {
        const existingPlayer = session.players.find(p => p.name === username);
        
        // If game started and user isn't re-joining, block them
        if (session.status === 'active' && !existingPlayer) {
            return socket.emit('error', 'Game in progress! You cannot join now.');
        }

        const user = existingPlayer || session.addUser(socket.id, username);
        
        if (!user) {
            return socket.emit('error', 'Game is full! Maximum players reached.');
        }

        if (existingPlayer) existingPlayer.id = socket.id; 

        socket.emit('initPlayer', { ...user, id: socket.id });
        
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
            
            setTimeout(() => {
                session.status = 'waiting';
                // broadcast the current state; roles stay the same
                io.emit('updatePlayers', session.getPlayers());
            }, 5000);
        }
    });

    socket.on('disconnect', () => {
        // 1. Remove the user and check if Master rotated
        const masterChanged = session.removeUser(socket.id);
        
        // 2. If the room is now empty, delete/reset the session entirely
        if (session.players.length === 0) {
            clearTimeout(gameTimeout); // Stop any active timers
            session.resetAll(); 
            console.log("Session cleared: All players left.");
        } else {
            // 3. If players remain, notify them of the departure and potential new Master
            if (masterChanged) {
                io.emit('systemMessage', "The Master has left. A new Master has been appointed.");
            }
            io.emit('updatePlayers', session.getPlayers());
        }
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));