const socket = io();

const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const skipBtn = document.getElementById('skipBtn');
const imageInput = document.getElementById('imageInput');
const typingIndicator = document.getElementById('typingIndicator');

const soundSend = document.getElementById('soundSend');
const soundReceive = document.getElementById('soundReceive');

// Send Message
function sendMessage() {
    const text = messageInput.value.trim();
    if (text !== "") {
        appendMessage(text, 'sent');
        socket.emit('chatMessage', text);
        messageInput.value = '';
        soundSend.play().catch(() => {});
    }
}

// Render Messages
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

// Receive Message from Socket
socket.on('message', (data) => {
    if (data.system) {
        appendMessage(data.text, '', false, true);
    } else {
        appendMessage(data.text, 'received', data.isImage);
        soundReceive.play().catch(() => {});
    }
});

// Image Upload
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            appendMessage(evt.result, 'sent', true);
            socket.emit('chatMessage', { image: evt.result });
            soundSend.play().catch(() => {});
        };
        reader.readAsDataURL(file);
    }
});

// Typing Indicator Event
messageInput.addEventListener('input', () => {
    socket.emit('typing');
});

socket.on('displayTyping', () => {
    typingIndicator.style.display = 'block';
    setTimeout(() => { typingIndicator.style.display = 'none'; }, 2000);
});

// Next / Skip Button
skipBtn.addEventListener('click', () => {
    chatBox.innerHTML = '';
    appendMessage('Finding a new stranger... ⚡', '', false, true);
    socket.emit('nextStranger');
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
