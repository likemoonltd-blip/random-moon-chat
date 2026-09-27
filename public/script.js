const socket = io();

const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const skipBtn = document.getElementById('skipBtn');
const imageInput = document.getElementById('imageInput');
const typingIndicator = document.getElementById('typingIndicator');
const themeToggle = document.getElementById('themeToggle');

const soundSend = document.getElementById('soundSend');
const soundReceive = document.getElementById('soundReceive');

let currentTag = 'all';

// Message Send Logic
function sendMessage() {
    const text = messageInput.value.trim();
    if (text !== "") {
        appendMessage(text, 'sent');
        socket.emit('chatMessage', { text: text, isImage: false });
        messageInput.value = '';
        soundSend.play().catch(() => {});
    }
}

// Render Message Function
function appendMessage(msg, type, isImage = false, isSystem = false) {
    if (isSystem) {
        const sysDiv = document.createElement('div');
        sysDiv.classList.add('system-message');
        sysDiv.innerHTML = `<span>${msg}</span>`;
        chatBox.appendChild(sysDiv);
    } else {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', type);

        if (isImage) {
            msgDiv.innerHTML = `<img src="${msg}" class="chat-img-blurred" title="Click to Unblur" onclick="this.style.filter='none'">`;
        } else {
            msgDiv.textContent = msg;
        }
        chatBox.appendChild(msgDiv);
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Socket Receive Message
socket.on('message', (data) => {
    if (data.system) {
        appendMessage(data.text, '', false, true);
    } else if (typeof data === 'object') {
        if (data.image || data.isImage) {
            appendMessage(data.image || data.text, 'received', true);
        } else {
            appendMessage(data.text, 'received', false);
        }
        soundReceive.play().catch(() => {});
    } else {
        appendMessage(data, 'received', false);
        soundReceive.play().catch(() => {});
    }
});

// Image Upload Fix
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const imgData = evt.target.result;
            appendMessage(imgData, 'sent', true);
            socket.emit('chatMessage', { image: imgData, isImage: true });
            soundSend.play().catch(() => {});
        };
        reader.readAsDataURL(file);
    }
});

// Interest Tags Click Event
document.querySelectorAll('.tag').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tag').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentTag = button.getAttribute('data-tag');
        
        chatBox.innerHTML = '';
        appendMessage(`Filter set to: ${button.textContent}. Finding stranger... ⚡`, '', false, true);
        socket.emit('nextStranger', { interest: currentTag });
    });
});

// Theme Toggle
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
    });
}

// Typing Indicator
messageInput.addEventListener('input', () => {
    socket.emit('typing');
});

socket.on('displayTyping', () => {
    typingIndicator.style.display = 'block';
    setTimeout(() => { typingIndicator.style.display = 'none'; }, 2000);
});

// Skip Button
skipBtn.addEventListener('click', () => {
    chatBox.innerHTML = '';
    appendMessage('Finding a new stranger... ⚡', '', false, true);
    socket.emit('nextStranger', { interest: currentTag });
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
