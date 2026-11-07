const BASE_URL = 'http://localhost:3000';

// Initialize WebSocket connection
const socket = io(BASE_URL);

async function loadMovies() {
    try {
        const res = await fetch(`${BASE_URL}/movies`);
        const movies = await res.json();

        const tbody = document.querySelector('#movieTable tbody');
        tbody.innerHTML = '';
        movies.forEach(movie => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${movie.name}</td>
                <td>${movie.genre}</td>
                <td>${movie.rating}</td>
                <td><a href="details.html?id=${movie._id}">Details</a></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading movies:', error);
        alert('Failed to load movie list.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadMovies();

    // Handle form submission
    document.getElementById('addMovieForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const newMovie = {
            name: document.getElementById('newName').value,
            genre: document.getElementById('newGenre').value,
            rating: 0
        };

        try {
            const res = await fetch(`${BASE_URL}/movies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMovie)
            });

            const data = await res.json();
            console.log('Movie added:', data);
            alert(`Movie "${data.name}" added!`);
            loadMovies();
            e.target.reset();
        } catch (error) {
            console.error('Error adding movie:', error);
            alert('Failed to add movie.');
        }
    });

    // Step 2: Listen for messages from users
    const incomingMessages = document.getElementById('incomingMessages');
    const replyInput = document.getElementById('agentReplyInput');
    const sendBtn = document.getElementById('sendReplyBtn');

    // Ensure no duplicate listeners
    socket.off('incomingUserMessage');

    // Helper to show messages with proper format
    function appendMessage(sender, message) {
        const messageDiv = document.createElement('div');

        // Determine the class and background color based on the sender
        if (sender === 'Agent') {
            messageDiv.className = 'message agent-message';
            messageDiv.style.backgroundColor = '#d0e7ff';
        } else if (sender === 'Manager') {
            messageDiv.className = 'message manager-message text-end';
            messageDiv.style.backgroundColor = '#ffe4b5';
        } else {
            messageDiv.className = 'message user-message';
            messageDiv.style.backgroundColor = '#f8f9fa';
        }

        const timestamp = new Date().toLocaleString('en-US');
        const timestampElement = document.createElement('small');
        timestampElement.className = 'timestamp';
        timestampElement.textContent = timestamp;

        const messageContent = document.createElement('p');

        // Determine the label based on the sender
        if (sender === 'Agent') {
            messageContent.textContent = `Agent: ${message}`;
        } else if (sender === 'Manager') {
            messageContent.textContent = `Manager (You): ${message}`;
        } else {
            messageContent.textContent = `User: ${message}`;
        }

        messageDiv.appendChild(timestampElement);
        messageDiv.appendChild(messageContent);

        incomingMessages.appendChild(messageDiv);
        incomingMessages.scrollTop = incomingMessages.scrollHeight;
    }

    // Receive user messages
    socket.on('incomingUserMessage', (msg) => {
        appendMessage('User', msg);
    });

    // Listen for user messages
    socket.on('userIncomingMessage', (msg) => {
        appendMessage('User', msg);
    });

    // Listen for assistant replies
    socket.on('agentReply', (reply) => {
        appendMessage('Agent', reply);
    });

    // Listen for manager replies
    socket.on('managerReply', (reply) => {
        appendMessage('Manager', reply);
    });

    // Step 3: Send agent reply
    sendBtn?.addEventListener('click', () => {
        const reply = replyInput.value.trim();
        if (!reply) return;

        appendMessage('Manager', reply);
        socket.emit('managerReply', reply);

        replyInput.value = '';
    });
});
