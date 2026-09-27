const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    if (waitingUser) {
        let roomName = `room_${waitingUser.id}_${socket.id}`;
        socket.join(roomName);
        waitingUser.join(roomName);

        socket.room = roomName;
        waitingUser.room = roomName;

        io.to(roomName).emit('message', { text: 'Connected to a random stranger! 🌙', system: true });
        waitingUser = null;
    } else {
        waitingUser = socket;
        socket.emit('message', { text: 'Waiting for a stranger to join...', system: true });
    }

    socket.on('chatMessage', (data) => {
        if (socket.room) {
            socket.to(socket.room).emit('message', { text: data, system: false });
        }
    });

    socket.on('typing', () => {
        if (socket.room) {
            socket.to(socket.room).emit('displayTyping');
        }
    });

    socket.on('nextStranger', () => {
        if (socket.room) {
            socket.to(socket.room).emit('message', { text: 'Stranger has left the chat.', system: true });
            socket.leave(socket.room);
            socket.room = null;
        }
        if (waitingUser === socket) {
            waitingUser = null;
        }
        
        if (waitingUser) {
            let roomName = `room_${waitingUser.id}_${socket.id}`;
            socket.join(roomName);
            waitingUser.join(roomName);
            socket.room = roomName;
            waitingUser.room = roomName;
            io.to(roomName).emit('message', { text: 'Connected to a new stranger!', system: true });
            waitingUser = null;
        } else {
            waitingUser = socket;
            socket.emit('message', { text: 'Waiting for a new stranger...', system: true });
        }
    });

    socket.on('disconnect', () => {
        if (socket.room) {
            socket.to(socket.room).emit('message', { text: 'Stranger disconnected.', system: true });
        }
        if (waitingUser === socket) {
            waitingUser = null;
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
