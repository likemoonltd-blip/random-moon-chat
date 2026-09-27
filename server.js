const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let waitingUsers = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Matching Queue
    socket.on('nextStranger', (data) => {
        leaveRoom(socket);
        findMatch(socket, data ? data.interest : 'all');
    });

    function findMatch(sock, interest = 'all') {
        if (waitingUsers.length > 0) {
            let partner = waitingUsers.shift();
            let roomName = `room_${partner.id}_${sock.id}`;

            sock.join(roomName);
            partner.join(roomName);

            sock.room = roomName;
            partner.room = roomName;

            io.to(roomName).emit('message', { text: 'Connected to a stranger! 🌙', system: true });
        } else {
            waitingUsers.push(sock);
            sock.emit('message', { text: 'Waiting for a stranger to join...', system: true });
        }
    }

    findMatch(socket);

    function leaveRoom(sock) {
        if (sock.room) {
            sock.to(sock.room).emit('message', { text: 'Stranger has left the chat.', system: true });
            sock.leave(sock.room);
            sock.room = null;
        }
        waitingUsers = waitingUsers.filter(u => u.id !== sock.id);
    }

    // Chat Message
    socket.on('chatMessage', (data) => {
        if (socket.room) {
            socket.to(socket.room).emit('message', data);
        }
    });

    // Typing Status
    socket.on('typing', () => {
        if (socket.room) {
            socket.to(socket.room).emit('displayTyping');
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        leaveRoom(socket);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
