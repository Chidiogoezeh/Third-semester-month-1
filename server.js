import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameSession } from './src/gameLogic.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static('public'));

const session = new GameSession();

io.on('connection', (socket) => {
    socket.on('joinGame', (username) => {
        const user = session.addUser(socket.id, username);
        if (user) {
            io.emit('updatePlayers', session.getPlayers());
            socket.emit('initPlayer', user);
        }
    });

    socket.on('setGameRules', (data) => {
        if (session.isMaster(socket.id)) {
            session.setQuestion(data.question, data.answer);
            io.emit('gameReady');
        }
    });

    socket.on('startGame', () => {
        if (session.canStart(socket.id)) {
            session.start();
            io.emit('gameStarted', { question: session.currentQuestion });
            
            // 60-second timer
            setTimeout(() => {
                const result = session.endByTimeout();
                if (result) io.emit('gameEnded', result);
            }, 60000);
        }
    });

    socket.on('submitGuess', (guess) => {
        const result = session.handleGuess(socket.id, guess);
        if (result.isCorrect) {
            io.emit('gameEnded', result);
        } else {
            socket.emit('guessResult', result);
        }
        io.emit('updatePlayers', session.getPlayers());
    });

    socket.on('disconnect', () => {
        session.removeUser(socket.id);
        io.emit('updatePlayers', session.getPlayers());
    });
});

httpServer.listen(3000, () => console.log('Server running on http://localhost:3000'));